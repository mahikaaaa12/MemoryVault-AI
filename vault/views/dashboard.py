"""
MemoryVault AI — Dashboard and simple page views.

Covers the Dashboard (with its live stat/chart/timeline helpers), the
still-mostly-static Productivity/Profile/Settings/Help Center pages, and
the AI Assistant page's chat endpoint. Split out of the original
monolithic views.py during Step 16's code-quality pass (Area 1).
"""
import json
from collections import Counter
from datetime import timedelta

from dateutil.relativedelta import relativedelta

from django.contrib import messages
from django.contrib.auth import logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Case, Count, IntegerField, Q, Value, When
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST

from .. import ai_service
from ..models import AIConversation, AIMessage, Collection, Memory, Notification, Tag, Task


def _dashboard_greeting(user):
    """Time-of-day greeting + display name for the welcome banner (Step 14a)."""
    hour = timezone.localtime().hour
    if hour < 12:
        part_of_day = 'morning'
    elif hour < 18:
        part_of_day = 'afternoon'
    else:
        part_of_day = 'evening'
    return {
        'greeting': f'Good {part_of_day}',
        'display_name': user.first_name or user.username,
    }


def _dashboard_stats(user):
    """Live per-user aggregates for the 4 dashboard stat cards (Step 14a).

    Deltas compare "this week" (last 7 days) against the *previous* 7-day
    window, using real `created_at` timestamps rather than mock numbers.
    """
    now = timezone.now()
    week_start      = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)

    base_qs = Memory.objects.live().filter(user=user)

    total_memories = base_qs.count()

    this_week_count = base_qs.filter(created_at__gte=week_start).count()
    prev_week_count = base_qs.filter(
        created_at__gte=prev_week_start, created_at__lt=week_start
    ).count()

    total_favorites = base_qs.filter(is_favorite=True).count()
    favorites_this_week = base_qs.filter(
        is_favorite=True, created_at__gte=week_start
    ).count()

    total_insights = base_qs.exclude(ai_summary='').count()
    insights_this_week = base_qs.exclude(ai_summary='').filter(created_at__gte=week_start).count()

    # % change in weekly capture rate, vs. the prior 7-day window.
    if prev_week_count:
        total_pct_delta = round(((this_week_count - prev_week_count) / prev_week_count) * 100)
    else:
        total_pct_delta = 100 if this_week_count else 0

    return {
        'total_memories':   total_memories,
        'total_delta_pct':  total_pct_delta,
        'total_delta_dir':  'up' if total_pct_delta >= 0 else 'neutral',

        'week_count':       this_week_count,
        'week_delta':       this_week_count - prev_week_count,
        'week_delta_dir':   'up' if this_week_count >= prev_week_count else 'neutral',

        'favorite_count':      total_favorites,
        'favorite_delta':      favorites_this_week,
        'favorite_delta_dir':  'up' if favorites_this_week > 0 else 'neutral',

        'insight_count':        total_insights,
        'insights_this_week':   insights_this_week,
    }


def _dashboard_recent_memories(user):
    """Most recently captured memories for the dashboard's \"Recent
    memories\" list (Step 14b). `tags` is prefetched since the card
    template renders each memory's tag chips.
    """
    recent = (
        Memory.objects
        .live().filter(user=user)
        .prefetch_related('tags')
        .order_by('-created_at')[:4]
    )
    return {'recent_memories': recent}


def _dashboard_weekly_chart(user):
    """Real per-day capture counts (Notes / Conversations / Voice) for the
    last 7 days — feeds both the Weekly productivity chart and the AI
    Insight prompt's WEEK_ACTIVITY payload (Step 14b).
    """
    today = timezone.localtime().date()
    start = today - timedelta(days=6)
    days = [start + timedelta(days=i) for i in range(7)]

    rows = (
        Memory.objects
        .live()
        .filter(
            user=user,
            type__in=['note', 'conversation', 'voice_memo'],
            created_at__date__gte=start,
        )
        .annotate(day=TruncDate('created_at'))
        .values('day', 'type')
        .annotate(count=Count('id'))
    )
    counts = {(row['day'], row['type']): row['count'] for row in rows}

    return {
        'chart_data': {
            'labels':         [d.strftime('%a') for d in days],
            'notes':          [counts.get((d, 'note'), 0) for d in days],
            'conversations':  [counts.get((d, 'conversation'), 0) for d in days],
            'voice':          [counts.get((d, 'voice_memo'), 0) for d in days],
        }
    }


def _dashboard_top_tags(user):
    """User's most-used tags (by non-deleted memory count) — feeds the AI
    Insight prompt's `topTags` field with real data instead of a fixed
    list (Step 14c).
    """
    tags = (
        Tag.objects
        .filter(user=user)
        .annotate(usage=Count('memories', filter=Q(memories__deleted_at__isnull=True)))
        .filter(usage__gt=0)
        .order_by('-usage', 'name')[:6]
    )
    return {'top_tags': [t.name for t in tags]}


def _dashboard_tasks(user):
    """A handful of the user's most actionable tasks for the "Recent
    tasks" widget (Step 14c). Open tasks (soonest due date first) are
    shown ahead of completed ones so the list stays useful at a glance.
    """
    tasks = (
        Task.objects
        .filter(user=user)
        .annotate(_done_rank=Case(
            When(status='done', then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        ))
        .order_by('_done_rank', 'due_date')[:4]
    )
    return {'dashboard_tasks': tasks}


def _dashboard_timeline(user):
    """Recent-activity feed built from real Memory captures and
    Notification records — replaces the hardcoded timeline (Step 14c).
    """
    MEMORY_TIMELINE_LABELS = {
        'note':         'Note captured',
        'conversation': 'Conversation saved',
        'meeting':      'Meeting notes added',
        'voice_memo':   'Voice memo captured',
        'image':        'Image saved',
        'document':     'Document saved',
        'activity':     'Activity logged',
    }
    NOTIF_TIMELINE = {
        'insight': ('AI insight generated', '#9F75F0'),
        'digest':  ('Daily digest sent',    '#14B8A6'),
        'system':  ('System notification',  '#6B7290'),
    }

    events = []

    for memory in Memory.objects.live().filter(user=user).order_by('-created_at')[:5]:
        events.append({
            'dot_color': memory.type_color,
            'label':     MEMORY_TIMELINE_LABELS.get(memory.type, 'Memory captured'),
            'sub':       memory.title,
            'created_at': memory.created_at,
        })

    for notif in Notification.objects.filter(user=user).order_by('-created_at')[:5]:
        label, color = NOTIF_TIMELINE.get(notif.type, ('Notification', '#6B7290'))
        events.append({
            'dot_color': color,
            'label':     label,
            'sub':       notif.message,
            'created_at': notif.created_at,
        })

    events.sort(key=lambda e: e['created_at'], reverse=True)
    return {'timeline_events': events[:4]}


@ensure_csrf_cookie
@login_required
def dashboard(request):
    context = {'active_nav': 'dashboard'}
    context.update(_dashboard_greeting(request.user))
    context.update(_dashboard_stats(request.user))
    context.update(_dashboard_recent_memories(request.user))
    context.update(_dashboard_weekly_chart(request.user))
    context.update(_dashboard_tasks(request.user))
    context.update(_dashboard_timeline(request.user))
    return render(request, 'vault/dashboard.html', context)


@login_required
@require_POST
def dashboard_ai_insight(request):
    """AJAX endpoint backing the Dashboard's "AI Insight" card. Builds the
    same weekly-activity payload the JS used to assemble client-side, but
    generates the insight server-side via ai_service so the Anthropic API
    key never has to reach the browser (Step 15a).
    """
    chart  = _dashboard_weekly_chart(request.user)['chart_data']
    stats  = _dashboard_stats(request.user)
    tags   = _dashboard_top_tags(request.user)['top_tags']

    activity = {
        'days':            chart['labels'],
        'notes':           chart['notes'],
        'conversations':   chart['conversations'],
        'voice':           chart['voice'],
        'top_tags':        tags,
        'total_memories':  stats['total_memories'],
        'week_captures':   stats['week_count'],
        'favorites':       stats['favorite_count'],
    }

    insight = ai_service.get_dashboard_insight(activity)
    return JsonResponse({'insight': insight})


@login_required
@require_POST
def dashboard_task_toggle(request, pk):
    """AJAX endpoint backing the Dashboard's "Recent tasks" checkbox —
    flips a task between 'done' and its prior open status and persists
    it, so the toggle survives a page refresh (Step 14c).
    """
    task = get_object_or_404(Task, pk=pk, user=request.user)
    task.status = 'todo' if task.status == 'done' else 'done'
    task.save(update_fields=['status'])
    return JsonResponse({
        'status':      task.status,
        'badge_label': task.badge_label,
        'badge_color': task.badge_color,
        'badge_bg':    task.badge_bg,
    })


@ensure_csrf_cookie
@login_required
def productivity(request):
    """Renders the Tasks/Calendar shell; the page's JS fetches the
    actual task and event data from the JSON API in views/productivity.py
    so the existing kanban drag-and-drop and calendar UI keep working
    without a full page reload (Step 17, Batch 3)."""
    return render(request, 'vault/productivity.html', {'active_nav': 'productivity'})


def _profile_overview(user):
    """Identity card + top-level stat tiles for the Profile Overview tab."""
    live = Memory.objects.live().filter(user=user)
    return {
        'profile_obj':       user.profile,
        'total_memories':    live.count(),
        'total_collections': Collection.objects.filter(user=user).count(),
        'total_favorites':   live.filter(is_favorite=True).count(),
    }


def _profile_stats(user):
    """Type breakdown, 6-month growth chart, and usage insights for the
    Profile Statistics tab — all derived from real Memory rows instead of
    a fixed 96/41/58/27 style mock.
    """
    live = Memory.objects.live().filter(user=user)

    type_counts = dict(
        live.values('type').annotate(n=Count('id')).values_list('type', 'n')
    )

    # 6-month cumulative growth, oldest → newest, ending this month.
    today = timezone.localtime().date().replace(day=1)
    months = [today - relativedelta(months=i) for i in range(5, -1, -1)]
    growth_labels, growth_data = [], []
    for month_start in months:
        month_end = month_start + relativedelta(months=1)
        growth_labels.append(month_start.strftime('%b'))
        growth_data.append(live.filter(created_at__date__lt=month_end).count())

    # Longest consecutive-day capture streak, computed from distinct dates.
    capture_dates = sorted(set(
        live.order_by().values_list('created_at__date', flat=True)
    ))
    longest_streak = current_run = 0
    prev_date = None
    for d in capture_dates:
        if prev_date is not None and (d - prev_date).days == 1:
            current_run += 1
        else:
            current_run = 1
        longest_streak = max(longest_streak, current_run)
        prev_date = d

    # Most active weekday, by capture count.
    weekday_counts = Counter(d.strftime('%A') for d in capture_dates)
    most_active_day = weekday_counts.most_common(1)[0][0] if weekday_counts else '—'

    weeks_since_joined = max((timezone.now() - user.date_joined).days / 7, 1)
    avg_per_week = round(live.count() / weeks_since_joined, 1)

    return {
        'notes_count':        type_counts.get('note', 0),
        'voice_count':        type_counts.get('voice_memo', 0),
        'conversation_count': type_counts.get('conversation', 0),
        'meeting_count':      type_counts.get('meeting', 0),
        'growth_labels':      growth_labels,
        'growth_data':        growth_data,
        'avg_per_week':       avg_per_week,
        'longest_streak':     longest_streak,
        'most_active_day':    most_active_day,
        'ai_insight_count':   live.exclude(ai_summary='').count(),
    }


def _profile_achievements(user):
    """Achievement badges with real progress, computed from the user's
    actual activity instead of a fixed grid of unlocked/locked cards.
    """
    live = Memory.objects.live().filter(user=user)
    total = live.count()
    conversations = live.filter(type='conversation').count()
    notes = live.filter(type='note').count()
    voice = live.filter(type='voice_memo').count()
    collections = Collection.objects.filter(user=user).count()
    ai_questions = AIMessage.objects.filter(conversation__user=user, role='user').count()
    days_active = (timezone.now() - user.date_joined).days

    # Longest streak is reused from _profile_stats' definition.
    capture_dates = sorted(set(live.order_by().values_list('created_at__date', flat=True)))
    longest_streak = current_run = 0
    prev_date = None
    for d in capture_dates:
        current_run = current_run + 1 if prev_date and (d - prev_date).days == 1 else 1
        longest_streak = max(longest_streak, current_run)
        prev_date = d

    def badge(id, title, desc, icon, color, have, need):
        locked = have < need
        entry = {
            'id': id, 'title': title, 'desc': desc, 'icon': icon,
            'color': color, 'locked': locked,
        }
        if locked:
            entry['progress'] = min(round(have / need * 100), 99) if need else 0
        return entry

    return {'achievements': [
        badge('first_capture', 'First Capture', 'Captured your very first memory',
              'rocket', 'linear-gradient(135deg,#722CE4,#5B21B6)', total, 1),
        badge('streak_7', '7-Day Streak', 'Captured memories for 7 days in a row',
              'flame', '#F59E0B', longest_streak, 7),
        badge('conversationalist', 'Conversationalist', 'Logged 50 conversations',
              'message-circle', '#10B981', conversations, 50),
        badge('note_taker', 'Note Taker', 'Captured 100 notes',
              'notebook', '#3B82F6', notes, 100),
        badge('ai_explorer', 'AI Explorer', 'Asked the AI Assistant 25 questions',
              'sparkles', '#A855F7', ai_questions, 25),
        badge('century_club', 'Century Club', 'Reach 500 total memories',
              'lock', '#454966', total, 500),
        badge('master_organizer', 'Master Organizer', 'Create 25 collections',
              'lock', '#454966', collections, 25),
        badge('voice_pioneer', 'Voice Pioneer', 'Captured 25 voice memos',
              'microphone', '#EC4899', voice, 25),
        badge('one_year', 'One Year Strong', 'Active for 365 days',
              'lock', '#454966', days_active, 365),
    ]}


def _profile_activity(user):
    """Recent-activity feed for the Profile Activity tab — a longer-form
    sibling of the Dashboard timeline (Step 14c helper), also folding in
    AI Assistant questions asked.
    """
    MEMORY_LABELS = {
        'note': 'Captured a new note', 'conversation': 'Logged a conversation',
        'meeting': 'Logged a meeting', 'voice_memo': 'Captured a voice memo',
        'image': 'Saved an image', 'document': 'Saved a document',
        'activity': 'Logged an activity',
    }
    MEMORY_SUB = {
        'note': 'Notes', 'conversation': 'Conversations', 'meeting': 'Meetings',
        'voice_memo': 'Voice Memos', 'image': 'Images', 'document': 'Documents',
        'activity': 'Activity',
    }
    MEMORY_DOT = {
        'note': '#3B82F6', 'conversation': '#10B981', 'meeting': '#F97316',
        'voice_memo': '#EC4899', 'image': '#A855F7', 'document': '#14B8A6',
        'activity': '#F59E0B',
    }

    events = []
    for m in Memory.objects.live().filter(user=user).order_by('-created_at')[:6]:
        events.append({
            'dot_color': MEMORY_DOT.get(m.type, '#6B7290'),
            'label': f'{MEMORY_LABELS.get(m.type, "Captured a memory")} — "{m.title}"',
            'sub': MEMORY_SUB.get(m.type, 'Memories'),
            'created_at': m.created_at,
        })
        if m.is_favorite:
            events.append({
                'dot_color': '#FBBF24',
                'label': f'Favorited "{m.title}"',
                'sub': 'Favorites',
                'created_at': m.updated_at,
            })

    for msg in AIMessage.objects.filter(conversation__user=user, role='user').order_by('-created_at')[:4]:
        events.append({
            'dot_color': '#9F75F0',
            'label': f'Asked the AI Assistant: "{msg.content[:60]}"',
            'sub': 'AI Assistant',
            'created_at': msg.created_at,
        })

    for c in Collection.objects.filter(user=user).order_by('-created_at')[:3]:
        events.append({
            'dot_color': '#14B8A6',
            'label': f'Created collection "{c.name}"',
            'sub': 'Collections',
            'created_at': c.created_at,
        })

    events.sort(key=lambda e: e['created_at'], reverse=True)
    return {'profile_activity': events[:8]}


@login_required
def profile(request):
    context = {'active_nav': 'profile'}
    context.update(_profile_overview(request.user))
    context.update(_profile_stats(request.user))
    context.update(_profile_achievements(request.user))
    context.update(_profile_activity(request.user))
    return render(request, 'vault/profile.html', context)


def _describe_request(request):
    """Best-effort real 'browser on OS — IP' label for the Settings page's
    Active Sessions card, replacing the fixed 'Chrome on macOS — Mumbai, IN'
    string with whatever actually made this request.
    """
    ua = request.META.get('HTTP_USER_AGENT', '')
    browser = next((b for b in ('Edg', 'Chrome', 'Firefox', 'Safari') if b in ua), 'Browser')
    browser = {'Edg': 'Edge'}.get(browser, browser)
    os_name = next(
        (o for o in ('Windows', 'Mac OS X', 'Linux', 'Android', 'iPhone', 'iPad') if o in ua),
        'Unknown OS',
    )
    ip = request.META.get('REMOTE_ADDR', 'unknown IP')
    return f'{browser} on {os_name} — {ip}'


@login_required
def settings_page(request):
    profile = request.user.profile

    if request.method == 'POST':
        form_id = request.POST.get('form_id', 'preferences')

        if form_id == 'password':
            current_pw = request.POST.get('current_password', '')
            new_pw = request.POST.get('new_password', '')
            if not request.user.check_password(current_pw):
                messages.error(request, 'Current password is incorrect.')
            elif not new_pw:
                messages.error(request, 'Enter a new password.')
            else:
                try:
                    validate_password(new_pw, user=request.user)
                except ValidationError as exc:
                    for err in exc.messages:
                        messages.error(request, err)
                else:
                    request.user.set_password(new_pw)
                    request.user.save()
                    update_session_auth_hash(request, request.user)
                    messages.success(request, 'Password updated.')
            return redirect(f"{reverse('vault:settings')}?tab=security")

        if form_id == 'delete_account':
            request.user.delete()
            logout(request)
            messages.success(request, 'Your account and all its data have been deleted.')
            return redirect('login')

        # ── Main "Save Changes" button — Appearance / Notifications /
        # AI / Privacy / Accessibility toggles + display name & email.
        request.user.first_name = request.POST.get('display_name', request.user.first_name).strip()
        email = request.POST.get('email', '').strip()
        if email:
            request.user.email = email
        request.user.save(update_fields=['first_name', 'email'])

        def flag(name):
            return request.POST.get(name) == 'on'

        profile.appearance_preferences = {
            'dark_mode':             flag('darkMode'),
            'compact_view':          flag('compactView'),
            'animated_transitions':  flag('animTrans'),
            'accent_color':          request.POST.get('accent_color', profile.appearance_preferences.get('accent_color', '#7C3AED')),
            'text_size':             request.POST.get('text_size', profile.appearance_preferences.get('text_size', 'medium')),
        }
        profile.notification_preferences = {
            'daily_digest':           flag('dailyDigest'),
            'weekly_report':          flag('weeklyInsights'),
            'anniversary_reminders':  flag('anniversary'),
            'ai_insights':            profile.notification_preferences.get('ai_insights', True),
            'bell_badge':             flag('bellBadge'),
            'push_notifications':     flag('pushNotif'),
        }
        profile.ai_preferences = {
            'auto_summarize':      flag('autoSummarize'),
            'suggest_related':     flag('suggestRelated'),
            'ai_tagging':          flag('aiTagging'),
            'proactive_insights':  flag('proactiveInsights'),
            'ai_tone':             request.POST.get('ai_tone', profile.ai_preferences.get('ai_tone', 'concise')),
            'context_depth':       profile.ai_preferences.get('context_depth', '8'),
        }
        profile.privacy_preferences = {
            'ai_improve':           flag('aiImprove'),
            'usage_analytics':      flag('usageAnalytics'),
            'public_profile':       flag('publicProfile'),
            'third_party':          flag('thirdParty'),
            'data_retention_days':  request.POST.get('data_retention_days', profile.privacy_preferences.get('data_retention_days', '30')),
        }
        profile.accessibility_preferences = {
            'reduce_motion':   flag('reduceMotion'),
            'high_contrast':   flag('highContrast'),
            'focus_rings':     flag('focusRings'),
            'screen_reader':   flag('screenReader'),
        }
        profile.save()
        messages.success(request, 'Settings saved.')
        return redirect(reverse('vault:settings') + (f"?tab={request.POST.get('active_tab')}" if request.POST.get('active_tab') else ''))

    context = {
        'active_nav': 'settings',
        'profile_obj': profile,
        'active_tab': request.GET.get('tab', 'appearance'),
        'current_session_label': _describe_request(request),
    }
    return render(request, 'vault/settings.html', context)


@login_required
def help_center(request):
    return render(request, 'vault/help_center.html', {'active_nav': 'help_center'})


@login_required
def ai_assistant(request):
    """Renders the AI Assistant page. `memories_json` is the user's own
    real, non-deleted memory library — it backs the Summarize/Auto-
    Tagging/Categorize/Related dropdowns client-side. It replaces a
    hardcoded demo dataset that used to live directly in the template.
    """
    memories = (
        Memory.objects.filter(user=request.user, deleted_at__isnull=True)
        .prefetch_related('tags')
        .order_by('-occurred_at', '-created_at')[:200]
    )
    memories_payload = [
        {
            'id': m.pk,
            'type': m.type,
            'title': m.title,
            'content': ai_service.clean_html(m.content),
            'summary': m.ai_summary or ai_service.clean_html(m.content)[:200],
            'tags': [t.name for t in m.tags.all()],
            'category': m.category,
        }
        for m in memories
    ]
    return render(request, 'vault/ai_assistant.html', {
        'active_nav': 'ai_assistant',
        'memories_json': json.dumps(memories_payload),
        'has_memories': bool(memories_payload),
    })


@login_required
@require_POST
def ai_assistant_chat(request):
    """AJAX endpoint backing the AI Assistant page's Chat tab (Step 15c).
    Runs get_rag_chat_response() server-side against the user's real
    memories and persists the exchange to AIConversation/AIMessage, so
    the Anthropic API key never reaches the browser and chat history
    survives a page refresh.
    """
    query = request.POST.get('message', '').strip()
    conversation_id = request.POST.get('conversation_id', '').strip()
    if not query:
        return JsonResponse({'error': 'Message is empty.'}, status=400)

    conversation = None
    if conversation_id:
        conversation = AIConversation.objects.filter(pk=conversation_id, user=request.user).first()
    if conversation is None:
        conversation = AIConversation.objects.create(user=request.user, title=query[:60])

    AIMessage.objects.create(conversation=conversation, role='user', content=query)

    answer, citations = ai_service.get_rag_chat_response(query, request.user, conversation=conversation)

    assistant_msg = AIMessage.objects.create(conversation=conversation, role='assistant', content=answer)
    if citations:
        assistant_msg.referenced_memories.set(citations)

    return JsonResponse({
        'conversation_id': conversation.pk,
        'answer': answer,
        'citations': [
            {'id': m.pk, 'title': m.title, 'type': m.get_type_display()}
            for m in citations
        ],
    })
