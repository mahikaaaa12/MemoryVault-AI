/* ============================================================
   MemoryVault AI — Account/Info pages shared behavior
   Used by Profile, Settings, Help Center, and AI Assistant:
   segmented-tab switching and FAQ accordion toggling.
   ============================================================ */

function showTab(group, name, btn) {
  document.querySelectorAll('.tab-panel[data-group="' + group + '"]').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.seg-tab[data-group="' + group + '"]').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab-panel[data-group="' + group + '"][data-name="' + name + '"]').classList.add('active');
  btn.classList.add('active');
}

function toggleAccordion(el) {
  const item = el.closest('.acc-item');
  const isOpen = item.classList.toggle('open');
  const ans = item.querySelector('.acc-a');
  ans.style.maxHeight = isOpen ? ans.scrollHeight + 'px' : '0px';
}
