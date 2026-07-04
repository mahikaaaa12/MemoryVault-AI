"""
MemoryVault AI — Categories views (Step 13b).

A "Category" in the UI is a Collection row (name/icon/color/
description). Membership is NOT tracked via Collection's M2M — it's
matched against Memory.category, a flat string field, exactly like the
reference JSX's `memory.category === category.name`. Split out of the
original monolithic views.py during Step 16's code-quality pass (Area 1).
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from ..forms import CollectionForm
from ..models import Collection, Memory, COLLECTION_COLOR_CHOICES, COLLECTION_ICON_CHOICES


def _category_context(request, open_pk=None):
    """Shared context builder for the Categories list + optional detail panel."""
    collections = list(Collection.objects.filter(user=request.user))
    live_memories = Memory.objects.live().filter(user=request.user)

    total_memories = live_memories.count()

    # One grouped-count query for every collection, instead of calling
    # c.memory_count (a fresh Memory.objects.filter(...).count() query)
    # once per collection in a Python loop — was N+1 on every Categories
    # page load, one extra query per category the user has created.
    counts_by_name = dict(
        live_memories.values('category').annotate(n=Count('id')).values_list('category', 'n')
    )
    for c in collections:
        c.live_count = counts_by_name.get(c.name, 0)
        c.live_pct = round((c.live_count / total_memories) * 100) if total_memories else 0
    counts = {c.id: c.live_count for c in collections}

    most_active = None
    if collections:
        most_active = max(collections, key=lambda c: counts.get(c.id, 0))
        if counts.get(most_active.id, 0) == 0:
            most_active = None

    avg_per_category = round(total_memories / len(collections)) if collections else 0

    open_category = None
    breakdown = []
    recent_items = []
    if open_pk:
        open_category = next((c for c in collections if c.id == open_pk), None)
        if open_category:
            items = list(open_category.memories_qs().prefetch_related('tags').order_by('-created_at'))
            by_type = {}
            for m in items:
                by_type.setdefault(m.type, {'label': m.get_type_display(), 'icon': m.type_icon,
                                             'color': m.type_color, 'count': 0})
                by_type[m.type]['count'] += 1
            max_count = max([v['count'] for v in by_type.values()], default=1)
            for v in by_type.values():
                v['pct'] = round((v['count'] / max_count) * 100) if max_count else 0
            breakdown = sorted(by_type.values(), key=lambda v: -v['count'])
            recent_items = items[:6]

    return {
        'active_nav': 'categories',
        'categories': collections,
        'category_counts': counts,
        'total_categories': len(collections),
        'total_memories': total_memories,
        'most_active_category': most_active,
        'avg_per_category': avg_per_category,
        'open_category': open_category,
        'category_breakdown': breakdown,
        'category_recent_items': recent_items,
        'icon_choices': COLLECTION_ICON_CHOICES,
        'color_choices': COLLECTION_COLOR_CHOICES,
    }


@login_required
def categories(request):
    """List all categories with live memory counts, and handle the
    "New Category" create form (POST)."""
    if request.method == 'POST':
        form = CollectionForm(request.POST, user=request.user)
        if form.is_valid():
            collection = form.save(commit=False)
            collection.user = request.user
            collection.save()
            messages.success(request, 'Category created.')
            return redirect('vault:categories')
    else:
        form = CollectionForm()

    open_pk = request.GET.get('open')
    context = _category_context(request, open_pk=int(open_pk) if open_pk and open_pk.isdigit() else None)
    context.update({'form': form, 'editing': None})
    return render(request, 'vault/categories.html', context)


@login_required
def category_edit(request, pk):
    """Update an existing category. Renders the same list template with
    the edit modal pre-opened, mirroring memory_edit()."""
    collection = get_object_or_404(Collection, pk=pk, user=request.user)
    # Must capture this BEFORE form validation: ModelForm.is_valid() calls
    # full_clean() -> _post_clean() -> construct_instance(), which mutates
    # `collection` (the form's `instance`) in place with the *new* field
    # values. Reading collection.name after is_valid() would already give
    # us the new name, making the rename-detection below always false.
    old_name = collection.name

    if request.method == 'POST':
        form = CollectionForm(request.POST, instance=collection, user=request.user)
        if form.is_valid():
            collection = form.save()
            if old_name != collection.name:
                # Keep existing memories pointed at the renamed category.
                Memory.objects.filter(user=request.user, category=old_name).update(category=collection.name)
            messages.success(request, 'Category updated.')
            return redirect('vault:categories')
    else:
        form = CollectionForm(instance=collection)

    context = _category_context(request)
    context.update({'form': form, 'editing': collection})
    return render(request, 'vault/categories.html', context)


@login_required
@require_POST
def category_delete(request, pk):
    """Delete a category. Any memories filed under it fall back to
    "Other" instead of being left with a dangling category name —
    matching DeleteCategoryModal's behaviour in the reference JSX."""
    collection = get_object_or_404(Collection, pk=pk, user=request.user)
    reassigned = collection.memories_qs().update(category='Other')
    name = collection.name
    collection.delete()
    if reassigned:
        messages.success(request, f'"{name}" deleted. {reassigned} memories moved to "Other".')
    else:
        messages.success(request, f'"{name}" deleted.')
    return redirect('vault:categories')
