"""
MemoryVault AI — AI Assistant page JSON API (Step 18).

Backs the Categorize / Related / Duplicates / NL Search / Insights /
Daily Recap / Weekly Report / Recommendations tabs on the AI Assistant
page. These previously ran entirely client-side against a hardcoded
MEMORIES array in ai_assistant.html and called api.anthropic.com
directly from the browser (no API key reachable client-side, so it
could never work in production). Every endpoint here mirrors the
existing memory_ai_summary / memory_ai_tags / ai_assistant_chat pattern:
real per-user data in, ai_service handles the Claude call + local
fallback, JSON out.
"""
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST

from .. import ai_service
from ..models import Memory


@login_required
@require_POST
def ai_categorize(request):
    title = request.POST.get('title', '').strip()
    content = request.POST.get('content', '').strip()
    if not content:
        return JsonResponse({'error': 'Add some content first.'}, status=400)
    result = ai_service.get_categorization(title, content, user=request.user)
    return JsonResponse(result)


@login_required
@require_POST
def ai_related(request):
    memory = get_object_or_404(Memory, pk=request.POST.get('memory_id'), user=request.user)
    related = ai_service.get_related_memories(memory, request.user)
    return JsonResponse({'results': [_serialize(m) for m in related]})


@login_required
@require_POST
def ai_duplicates(request):
    pairs = ai_service.get_duplicate_pairs(request.user)
    return JsonResponse({
        'pairs': [
            {'a': _serialize(p['a']), 'b': _serialize(p['b']), 'reason': p['reason'], 'similarity': p['similarity']}
            for p in pairs
        ]
    })


@login_required
@require_POST
def ai_nlsearch(request):
    query = request.POST.get('query', '').strip()
    if not query:
        return JsonResponse({'error': 'Enter a search query first.'}, status=400)
    results = ai_service.get_nl_search_results(query, request.user)
    return JsonResponse({'results': [{'memory': _serialize(r['memory']), 'reason': r['reason']} for r in results]})


@login_required
@require_POST
def ai_insights(request):
    insights = ai_service.get_productivity_insights(request.user)
    return JsonResponse({'insights': insights})


@login_required
@require_POST
def ai_recap(request):
    return JsonResponse({'recap': ai_service.get_daily_recap(request.user)})


@login_required
@require_POST
def ai_weekly(request):
    return JsonResponse({'report': ai_service.get_weekly_report(request.user)})


@login_required
@require_POST
def ai_recommend(request):
    return JsonResponse({'recs': ai_service.get_recommendations(request.user)})


def _serialize(m):
    """Minimal memory representation for the AI Assistant page's cards."""
    return {
        'id': m.pk,
        'type': m.type,
        'title': m.title,
        'summary': m.ai_summary or ai_service.clean_html(m.content)[:200],
        'tags': [t.name for t in m.tags.all()],
    }
