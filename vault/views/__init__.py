"""
MemoryVault AI — Views package.

Originally a single 994-line views.py; split by feature domain during
Step 16's code-quality pass (Area 1) for maintainability. Every name is
re-exported here so existing imports elsewhere in the project — both
`from . import views` in vault/urls.py and
`from vault import views as vault_views` in memoryvault_project/urls.py
— continue to work exactly as before, with zero call-site changes.

    vault/views/
        auth.py        Login, signup, logout, forgot/reset password
        dashboard.py    Dashboard, Productivity/Profile/Settings/Help
                        Center, AI Assistant + its chat endpoint
        memories.py     Memories CRUD, Archive/Trash tabs, AI summary/tags
        categories.py   Categories (Collections) CRUD
        search.py       Search page + recent-search management
        ai_assistant_api.py  AI Assistant page tabs (categorize, related,
                        duplicates, NL search, insights, recap, weekly,
                        recommendations) — real per-user data + AI
"""
from .auth import (
    forgot_password_view,
    login_view,
    logout_view,
    reset_password_view,
    signup_view,
)
from .dashboard import (
    ai_assistant,
    ai_assistant_chat,
    dashboard,
    dashboard_ai_insight,
    dashboard_task_toggle,
    help_center,
    productivity,
    profile,
    settings_page,
)
from .memories import (
    memories,
    memory_ai_summary,
    memory_ai_tags,
    memory_delete,
    memory_edit,
    memory_permanent_delete,
    memory_restore,
    memory_toggle_archive,
    memory_toggle_favorite,
    memory_toggle_pin,
)
from .categories import (
    categories,
    category_delete,
    category_edit,
)
from .search import (
    search,
    search_clear_recent,
    search_remove_recent,
)
from .productivity_api import (
    event_delete_api,
    event_list_api,
    event_save_api,
    task_delete_api,
    task_list_api,
    task_save_api,
    task_status_api,
)
from .ai_assistant_api import (
    ai_categorize,
    ai_duplicates,
    ai_insights,
    ai_nlsearch,
    ai_recap,
    ai_recommend,
    ai_related,
    ai_weekly,
)

__all__ = [
    # auth
    'login_view', 'signup_view', 'logout_view',
    'forgot_password_view', 'reset_password_view',
    # dashboard / pages
    'dashboard', 'dashboard_ai_insight', 'dashboard_task_toggle',
    'productivity', 'profile', 'settings_page', 'help_center',
    'ai_assistant', 'ai_assistant_chat',
    # memories
    'memories', 'memory_ai_summary', 'memory_ai_tags',
    'memory_edit', 'memory_delete', 'memory_toggle_favorite',
    'memory_toggle_pin', 'memory_toggle_archive', 'memory_restore',
    'memory_permanent_delete',
    # categories
    'categories', 'category_edit', 'category_delete',
    # search
    'search', 'search_clear_recent', 'search_remove_recent',
    # productivity (tasks + calendar JSON API)
    'task_list_api', 'task_save_api', 'task_delete_api', 'task_status_api',
    'event_list_api', 'event_save_api', 'event_delete_api',
    # AI Assistant page tabs (JSON API)
    'ai_categorize', 'ai_related', 'ai_duplicates', 'ai_nlsearch',
    'ai_insights', 'ai_recap', 'ai_weekly', 'ai_recommend',
]
