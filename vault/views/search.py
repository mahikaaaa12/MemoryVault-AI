"""
MemoryVault AI — Search views (Step 13c).

Keyword search across title/content/AI-summary/tag name, with
type/category/date-range/favorite/pinned filters — mirrors SearchPage's
`keywordResults` path in the reference JSX. The "AI Search" mode toggle
from the JSX is deliberately not wired up here; it arrives in Step 15
once real AI ranking exists. Split out of the original monolithic
views.py during Step 16's code-quality pass (Area 1).
"""
from datetime import timedelta

from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.shortcuts import redirect, render
from django.utils import timezone
from django.utils.html import strip_tags
from django.views.decorators.http import require_POST

from ..models import Collection, Memory, Tag

SEARCH_PAGE_SIZE = 15
RANGE_CHOICES = ('any', 'today', 'week', 'month')
RANGE_OPTIONS = [
    ('any',   'Any time'),
    ('today', 'Today'),
    ('week',  'Week'),
    ('month', 'Month'),
]
RECENT_SEARCHES_SESSION_KEY = 'recent_searches'
RECENT_SEARCHES_MAX = 8


def _apply_date_range(queryset, range_key):
    if range_key == 'today':
        cutoff = timezone.now() - timedelta(days=1)
    elif range_key == 'week':
        cutoff = timezone.now() - timedelta(days=7)
    elif range_key == 'month':
        cutoff = timezone.now() - timedelta(days=30)
    else:
        return queryset
    return queryset.filter(created_at__gte=cutoff)


def _search_snippet(content, query, length=160, context=40):
    """Plain-text excerpt centred on the first match, matching
    SearchResultRow's snippet logic in the reference JSX."""
    text = strip_tags(content or '')
    snippet = text[:length]
    if query:
        idx = text.lower().find(query.lower())
        if idx > context:
            snippet = '…' + text[idx - context: idx + 120]
    return snippet


@login_required
def search(request):
    """Search page: GET-driven so results are bookmarkable/shareable."""
    query           = request.GET.get('q', '').strip()
    type_filter     = request.GET.get('type', '')
    category_filter = request.GET.get('category', '')
    range_filter    = request.GET.get('range', 'any')
    if range_filter not in RANGE_CHOICES:
        range_filter = 'any'
    favorites_only  = request.GET.get('favorites') == '1'
    pinned_only     = request.GET.get('pinned') == '1'
    filters_open    = bool(type_filter or category_filter or favorites_only
                            or pinned_only or range_filter != 'any')

    base_qs = Memory.objects.live().filter(user=request.user)
    if type_filter:
        base_qs = base_qs.filter(type=type_filter)
    if category_filter:
        base_qs = base_qs.filter(category=category_filter)
    if favorites_only:
        base_qs = base_qs.filter(is_favorite=True)
    if pinned_only:
        base_qs = base_qs.filter(is_pinned=True)
    base_qs = _apply_date_range(base_qs, range_filter)

    results = []
    page_obj = None
    result_count = 0
    if query:
        results_qs = (
            base_qs.filter(
                Q(title__icontains=query)
                | Q(content__icontains=query)
                | Q(ai_summary__icontains=query)
                | Q(tags__name__icontains=query)
            )
            .prefetch_related('tags')
            .order_by('-is_pinned', '-occurred_at')
            .distinct()
        )
        paginator = Paginator(results_qs, SEARCH_PAGE_SIZE)
        page_obj = paginator.get_page(request.GET.get('page'))
        result_count = paginator.count

        # Only compute snippets for the current page's rows, not every
        # match in the vault.
        results = list(page_obj)
        for m in results:
            m.search_snippet = _search_snippet(m.content, query)

        recent = request.session.get(RECENT_SEARCHES_SESSION_KEY, [])
        recent = [r for r in recent if r.lower() != query.lower()]
        recent.insert(0, query)
        request.session[RECENT_SEARCHES_SESSION_KEY] = recent[:RECENT_SEARCHES_MAX]

    popular_tags = (
        Tag.objects.filter(user=request.user, memories__deleted_at__isnull=True)
        .annotate(cnt=Count('memories', distinct=True))
        .order_by('-cnt', 'name')[:8]
    )

    # Query string (minus `page`) so pagination links can carry the
    # active filters forward without a template-side param dance.
    carry_params = request.GET.copy()
    carry_params.pop('page', None)
    pagination_qs = carry_params.urlencode()

    return render(request, 'vault/search.html', {
        'active_nav': 'search',
        'pagination_qs': pagination_qs,
        'query': query,
        'results': results,
        'page_obj': page_obj,
        'result_count': result_count,
        'type_filter': type_filter,
        'category_filter': category_filter,
        'range_filter': range_filter,
        'favorites_only': favorites_only,
        'pinned_only': pinned_only,
        'filters_open': filters_open,
        'recent_searches': request.session.get(RECENT_SEARCHES_SESSION_KEY, []),
        'popular_tags': popular_tags,
        'browse_categories': Collection.objects.filter(user=request.user).order_by('name'),
        'type_choices': Memory.TYPE_CHOICES,
        'range_options': RANGE_OPTIONS,
    })


@login_required
@require_POST
def search_clear_recent(request):
    """Clear the recent-searches list (server-side, in the session)."""
    request.session.pop(RECENT_SEARCHES_SESSION_KEY, None)
    return redirect('vault:search')


@login_required
@require_POST
def search_remove_recent(request):
    """Remove a single term from the recent-searches list."""
    term = request.POST.get('term', '')
    recent = request.session.get(RECENT_SEARCHES_SESSION_KEY, [])
    recent = [r for r in recent if r.lower() != term.lower()]
    request.session[RECENT_SEARCHES_SESSION_KEY] = recent
    return redirect('vault:search')
