"""
MemoryVault AI — Productivity (Tasks + Calendar) API views (Step 17, Batch 3).

The Productivity page's Tasks and Calendar tabs are a client-rendered
kanban board / calendar grid with drag-and-drop, so — like the
Dashboard's task toggle and the AI Assistant's chat endpoint — state is
exposed as a small JSON API rather than full-page POST/redirects. This
lets productivity.html keep its existing UI/UX exactly as-is while
swapping the hardcoded in-memory `tasks`/`events` JS arrays for real
Task/Subtask/CalendarEvent rows scoped to request.user.
"""
import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date, parse_time
from django.views.decorators.http import require_GET, require_POST

from ..models import CalendarEvent, Subtask, Task, Tag


def _payload(request):
    try:
        return json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return {}


def _task_json(task):
    return {
        'id':       task.pk,
        'title':    task.title,
        'desc':     task.description,
        'priority': task.priority,
        'status':   task.status,
        'due':      task.due_date.isoformat(),
        # Iterate the prefetched manager with .all() rather than
        # .values_list() — the latter bypasses task_list_api's
        # prefetch_related('tags') cache and re-queries per task (N+1).
        'tags':     [t.name for t in task.tags.all()],
        'subtasks': [
            {'id': s.pk, 'text': s.text, 'done': s.is_done}
            for s in task.subtasks.all()
        ],
    }


def _event_json(event):
    return {
        'id':    event.pk,
        'title': event.title,
        'desc':  event.description,
        'date':  event.date.isoformat(),
        'time':  event.time.strftime('%H:%M') if event.time else None,
        'color': event.color,
    }


def _set_task_tags(task, names):
    """Resolve a list of tag-name strings into real Tag rows scoped to
    the task's owner — mirrors MemoryForm.save_tags()."""
    tags = []
    for raw in names or []:
        name = (raw or '').strip()
        if not name:
            continue
        tag, _ = Tag.objects.get_or_create(user=task.user, name=name)
        tags.append(tag)
    task.tags.set(tags)


def _set_subtasks(task, items):
    """Replace all subtasks with the posted list — simplest correct
    mapping for a small, always-fully-resent checklist."""
    task.subtasks.all().delete()
    Subtask.objects.bulk_create([
        Subtask(task=task, text=text, is_done=bool(item.get('done')))
        for item in (items or [])
        if (text := (item.get('text') or '').strip())
    ])


# ── Tasks ──────────────────────────────────────────────────────────

@login_required
@require_GET
def task_list_api(request):
    """All of the user's tasks, with subtasks/tags — replaces the
    hardcoded `tasks` array productivity.html used to boot with."""
    tasks = (
        Task.objects
        .filter(user=request.user)
        .prefetch_related('subtasks', 'tags')
    )
    return JsonResponse({'tasks': [_task_json(t) for t in tasks]})


@login_required
@require_POST
def task_save_api(request, pk=None):
    """Create (pk=None) or update (pk set) a task, including its
    subtasks and tags, from the task modal's "Save Task" button."""
    payload = _payload(request)
    title = (payload.get('title') or '').strip()
    if not title:
        return JsonResponse({'error': 'Title is required.'}, status=400)

    if pk:
        task = get_object_or_404(Task, pk=pk, user=request.user)
    else:
        task = Task(user=request.user)

    task.title = title
    task.description = (payload.get('desc') or '').strip()
    task.priority = payload.get('priority') or 'medium'
    task.status = payload.get('status') or 'todo'
    task.due_date = parse_date(payload.get('due') or '') or task.due_date
    task.save()

    _set_task_tags(task, payload.get('tags'))
    _set_subtasks(task, payload.get('subtasks'))

    return JsonResponse({'task': _task_json(task)})


@login_required
@require_POST
def task_delete_api(request, pk):
    task = get_object_or_404(Task, pk=pk, user=request.user)
    task.delete()
    return JsonResponse({'deleted': True})


@login_required
@require_POST
def task_status_api(request, pk):
    """Status-only update — backs the list view's checkbox and the
    kanban board's drag-and-drop, without needing the full edit
    payload (subtasks/tags untouched)."""
    status = _payload(request).get('status')
    if status not in dict(Task.STATUS_CHOICES):
        return JsonResponse({'error': 'Invalid status.'}, status=400)
    task = get_object_or_404(Task, pk=pk, user=request.user)
    task.status = status
    task.save(update_fields=['status'])
    return JsonResponse({'task': _task_json(task)})


# ── Calendar events ────────────────────────────────────────────────

@login_required
@require_GET
def event_list_api(request):
    """All of the user's calendar events — replaces the hardcoded
    `events` array productivity.html used to boot with."""
    events = CalendarEvent.objects.filter(user=request.user)
    return JsonResponse({'events': [_event_json(e) for e in events]})


@login_required
@require_POST
def event_save_api(request, pk=None):
    payload = _payload(request)
    title = (payload.get('title') or '').strip()
    if not title:
        return JsonResponse({'error': 'Title is required.'}, status=400)

    if pk:
        event = get_object_or_404(CalendarEvent, pk=pk, user=request.user)
    else:
        event = CalendarEvent(user=request.user)

    event.title = title
    event.description = (payload.get('desc') or '').strip()
    event.date = parse_date(payload.get('date') or '') or event.date
    event.time = parse_time(payload.get('time') or '') if payload.get('time') else None
    event.color = payload.get('color') or '#3B82F6'
    event.save()

    return JsonResponse({'event': _event_json(event)})


@login_required
@require_POST
def event_delete_api(request, pk):
    event = get_object_or_404(CalendarEvent, pk=pk, user=request.user)
    event.delete()
    return JsonResponse({'deleted': True})
