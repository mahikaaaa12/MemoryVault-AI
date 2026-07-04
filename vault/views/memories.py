"""
MemoryVault AI — Memories views (Step 12).

List/create/edit/delete, favorite/pin toggles, and the Archive/Trash
tabs (Step 13a). Split out of the original monolithic views.py during
Step 16's code-quality pass (Area 1).
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.views.decorators.http import require_POST

from .. import ai_service
from ..forms import MemoryForm
from ..models import Memory

VALID_TABS = ('timeline', 'archived', 'trash')
MEMORIES_PAGE_SIZE = 12


def _memory_list_for_tab(user, tab):
    """Shared queryset builder for the memories() and memory_edit() views —
    both need the same tab-filtered, tag-prefetched list behind the page."""
    base_qs = Memory.objects.filter(user=user)
    if tab == 'archived':
        memory_list = base_qs.live().filter(is_archived=True)
    elif tab == 'trash':
        memory_list = base_qs.deleted()
    else:
        memory_list = base_qs.live().filter(is_archived=False)
    return memory_list.prefetch_related('tags').order_by('-is_pinned', '-occurred_at')


def _valid_tab(request):
    """Read + validate the ?tab= query param — shared by memories() and
    memory_edit(), which both need the same fallback-to-'timeline' rule."""
    tab = request.GET.get('tab', 'timeline')
    return tab if tab in VALID_TABS else 'timeline'


def _render_memories_page(request, tab, form, editing):
    """Shared render for the Memories list+modal template — memories()
    and memory_edit() only differ in which `editing` instance (if any)
    should have its edit modal pre-opened."""
    memory_list = _memory_list_for_tab(request.user, tab)
    paginator = Paginator(memory_list, MEMORIES_PAGE_SIZE)
    page_obj = paginator.get_page(request.GET.get('page'))

    return render(request, 'vault/memories.html', {
        'active_nav': 'memories',
        'memories': page_obj,
        'page_obj': page_obj,
        'paginator': paginator,
        'form': form,
        'editing': editing,
        'active_tab': tab,
        'stats': _memory_stats(request.user),
    })


def _memories_redirect(tab):
    """Build a redirect back to the Memories list, preserving the active tab."""
    tab = tab if tab in VALID_TABS else 'timeline'
    return redirect(f"{reverse('vault:memories')}?tab={tab}")


def _memory_stats(user):
    """Counts for the stat row — always computed against all non-deleted
    memories regardless of which tab is currently active."""
    live = Memory.objects.live().filter(user=user)
    return {
        'total':     live.count(),
        'favorites': live.filter(is_favorite=True).count(),
        'pinned':    live.filter(is_pinned=True).count(),
        'archived':  live.filter(is_archived=True).count(),
    }


@login_required
@require_POST
def memory_ai_summary(request):
    """AJAX endpoint backing the memory modal's AI Summary "Suggest"
    button (Step 15b). Works from the in-progress form fields — the
    memory doesn't need to exist yet, matching the reference design
    where this fires before the memory is saved.
    """
    title   = request.POST.get('title', '').strip()
    content = request.POST.get('content', '').strip()
    if not content:
        return JsonResponse({'error': 'Add some content first.'}, status=400)

    summary = ai_service.get_ai_summary(title, content, user=request.user)
    if not summary:
        return JsonResponse({'error': "Couldn't generate a summary."}, status=200)
    return JsonResponse({'summary': summary})


@login_required
@require_POST
def memory_ai_tags(request):
    """AJAX endpoint backing the memory modal's Tags "Suggest" button
    (Step 15b). Returns suggested tag names; the modal merges them with
    whatever's already typed rather than replacing the field.
    """
    title    = request.POST.get('title', '').strip()
    content  = request.POST.get('content', '').strip()
    category = request.POST.get('category', '').strip()
    if not content:
        return JsonResponse({'error': 'Add some content first.'}, status=400)

    tags = ai_service.get_ai_tags(title, content, category=category, user=request.user)
    if not tags:
        return JsonResponse({'error': "Couldn't generate tags."}, status=200)
    return JsonResponse({'tags': tags})


@login_required
def memories(request):
    """
    List memories for the logged-in user, filtered by the active tab
    (?tab=timeline|archived|trash), and handle the "New Memory" capture
    form (POST).

    The create modal lives in the template; edits are handled by
    memory_edit() below, which reuses the same template/modal.
    """
    tab = _valid_tab(request)

    if request.method == 'POST':
        form = MemoryForm(request.POST, request.FILES)
        if form.is_valid():
            memory = form.save(commit=False)
            memory.user = request.user
            memory.save()
            form.save_tags(memory, request.user)
            messages.success(request, 'Memory captured.')
            return _memories_redirect(tab)
    else:
        form = MemoryForm()

    return _render_memories_page(request, tab, form, editing=None)


@login_required
def memory_edit(request, pk):
    """Update an existing memory. Renders the same list+modal template,
    with the modal pre-opened and pre-filled on GET (or on invalid POST)."""
    memory = get_object_or_404(Memory.objects.live(), pk=pk, user=request.user)

    tab = _valid_tab(request)

    if request.method == 'POST':
        form = MemoryForm(request.POST, request.FILES, instance=memory)
        if form.is_valid():
            memory = form.save(commit=False)
            memory.user = request.user
            memory.save()
            form.save_tags(memory, request.user)
            messages.success(request, 'Memory updated.')
            return _memories_redirect(tab)
    else:
        form = MemoryForm(instance=memory)

    return _render_memories_page(request, tab, form, editing=memory)


@login_required
@require_POST
def memory_delete(request, pk):
    """Soft-delete — sends the memory to Trash instead of erasing it."""
    memory = get_object_or_404(Memory.objects.live(), pk=pk, user=request.user)
    memory.soft_delete()
    messages.success(request, 'Memory moved to Trash.')
    return _memories_redirect(request.POST.get('tab', 'timeline'))


@login_required
@require_POST
def memory_toggle_favorite(request, pk):
    memory = get_object_or_404(Memory.objects.live(), pk=pk, user=request.user)
    memory.is_favorite = not memory.is_favorite
    memory.save(update_fields=['is_favorite'])
    return _memories_redirect(request.POST.get('tab', 'timeline'))


@login_required
@require_POST
def memory_toggle_pin(request, pk):
    memory = get_object_or_404(Memory.objects.live(), pk=pk, user=request.user)
    memory.is_pinned = not memory.is_pinned
    memory.save(update_fields=['is_pinned'])
    return _memories_redirect(request.POST.get('tab', 'timeline'))


@login_required
@require_POST
def memory_toggle_archive(request, pk):
    """Move a memory in/out of the Archive tab. Archiving also clears the
    pin (an archived memory shouldn't stay pinned to the top of Timeline)."""
    memory = get_object_or_404(Memory.objects.live(), pk=pk, user=request.user)
    memory.is_archived = not memory.is_archived
    update_fields = ['is_archived']
    if memory.is_archived and memory.is_pinned:
        memory.is_pinned = False
        update_fields.append('is_pinned')
    memory.save(update_fields=update_fields)
    messages.success(request, 'Memory archived.' if memory.is_archived else 'Memory unarchived.')
    return _memories_redirect(request.POST.get('tab', 'timeline'))


@login_required
@require_POST
def memory_restore(request, pk):
    """Restore a memory out of Trash back to Timeline (un-deletes it and
    clears any archived flag, matching Memory.restore())."""
    memory = get_object_or_404(Memory.objects.deleted(), pk=pk, user=request.user)
    memory.restore()
    messages.success(request, 'Memory restored.')
    return _memories_redirect('trash')


@login_required
@require_POST
def memory_permanent_delete(request, pk):
    """Permanently erase a memory that is already in Trash. Irreversible."""
    memory = get_object_or_404(Memory.objects.deleted(), pk=pk, user=request.user)
    memory.delete()
    messages.success(request, 'Memory permanently deleted.')
    return _memories_redirect('trash')
