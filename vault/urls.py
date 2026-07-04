from django.urls import path

from . import views

app_name = 'vault'

# ------------------------------------------------------------------
# Auth routes are registered WITHOUT the vault: namespace so that:
#   - The existing auth templates can use {% url 'login' %} etc.
#   - reverse('logout') works from views
#   - Django's LOGIN_URL = 'login' setting resolves correctly
# They are still defined in this file and served by this app.
# ------------------------------------------------------------------

# These bare-name patterns are added to ROOT urlconf directly (see
# memoryvault_project/urls.py) so they resolve without a namespace.
# The list below is for the NAMESPACED vault: routes only.

urlpatterns = [
    # ── Page views ────────────────────────────────────────────
    path('',                views.dashboard,    name='dashboard'),
    path('ai-insight/refresh/',    views.dashboard_ai_insight,  name='dashboard_ai_insight'),
    path('tasks/<int:pk>/toggle/', views.dashboard_task_toggle, name='dashboard_task_toggle'),
    path('productivity/',   views.productivity, name='productivity'),

    # ── Productivity JSON API — Tasks + Calendar (Step 17, Batch 3) ──
    path('productivity/api/tasks/',                views.task_list_api,   name='task_list_api'),
    path('productivity/api/tasks/new/',             views.task_save_api,   name='task_create_api'),
    path('productivity/api/tasks/<int:pk>/save/',   views.task_save_api,   name='task_update_api'),
    path('productivity/api/tasks/<int:pk>/delete/', views.task_delete_api, name='task_delete_api'),
    path('productivity/api/tasks/<int:pk>/status/', views.task_status_api, name='task_status_api'),
    path('productivity/api/events/',                views.event_list_api,   name='event_list_api'),
    path('productivity/api/events/new/',            views.event_save_api,   name='event_create_api'),
    path('productivity/api/events/<int:pk>/save/',  views.event_save_api,   name='event_update_api'),
    path('productivity/api/events/<int:pk>/delete/',views.event_delete_api, name='event_delete_api'),
    path('profile/',        views.profile,      name='profile'),
    path('settings/',       views.settings_page, name='settings'),
    path('help-center/',    views.help_center,  name='help_center'),
    path('ai-assistant/',   views.ai_assistant, name='ai_assistant'),
    path('ai-assistant/chat/', views.ai_assistant_chat, name='ai_assistant_chat'),
    path('ai-assistant/categorize/', views.ai_categorize, name='ai_categorize'),
    path('ai-assistant/related/',    views.ai_related,    name='ai_related'),
    path('ai-assistant/duplicates/', views.ai_duplicates, name='ai_duplicates'),
    path('ai-assistant/nlsearch/',   views.ai_nlsearch,   name='ai_nlsearch'),
    path('ai-assistant/insights/',   views.ai_insights,   name='ai_insights'),
    path('ai-assistant/recap/',      views.ai_recap,      name='ai_recap'),
    path('ai-assistant/weekly/',     views.ai_weekly,     name='ai_weekly'),
    path('ai-assistant/recommend/',  views.ai_recommend,  name='ai_recommend'),

    # ── Memories (Step 12) ───────────────────────────────────
    path('memories/',                views.memories,               name='memories'),
    path('memories/ai/summary/',     views.memory_ai_summary,      name='memory_ai_summary'),
    path('memories/ai/tags/',        views.memory_ai_tags,         name='memory_ai_tags'),
    path('memories/<int:pk>/edit/',  views.memory_edit,            name='memory_edit'),
    path('memories/<int:pk>/delete/',views.memory_delete,          name='memory_delete'),
    path('memories/<int:pk>/favorite/', views.memory_toggle_favorite, name='memory_favorite'),
    path('memories/<int:pk>/pin/',   views.memory_toggle_pin,      name='memory_pin'),

    # ── Archive / Trash (Step 13a) ───────────────────────────
    path('memories/<int:pk>/archive/',        views.memory_toggle_archive,  name='memory_archive'),
    path('memories/<int:pk>/restore/',        views.memory_restore,        name='memory_restore'),
    path('memories/<int:pk>/delete-forever/', views.memory_permanent_delete, name='memory_permanent_delete'),

    # ── Categories (Step 13b) ─────────────────────────────────
    path('categories/',                views.categories,      name='categories'),
    path('categories/<int:pk>/edit/',  views.category_edit,   name='category_edit'),
    path('categories/<int:pk>/delete/',views.category_delete, name='category_delete'),

    # ── Search (Step 13c) ─────────────────────────────────────
    path('search/',                views.search,               name='search'),
    path('search/clear-recent/',   views.search_clear_recent,  name='search_clear_recent'),
    path('search/remove-recent/',  views.search_remove_recent, name='search_remove_recent'),
]
