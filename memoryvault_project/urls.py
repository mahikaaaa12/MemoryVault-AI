"""
Root URL configuration for MemoryVault AI.

Auth routes live here WITHOUT a namespace so that:
  - {% url 'login' %}, {% url 'signup' %} etc. resolve in templates
  - Django's LOGIN_URL = 'login' redirects correctly

All authenticated page routes live under vault/urls.py with app_name='vault'.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from vault import views as vault_views

# Auth routes — bare names, no namespace
auth_patterns = [
    path('auth/login/',          vault_views.login_view,          name='login'),
    path('auth/signup/',         vault_views.signup_view,         name='signup'),
    path('auth/logout/',         vault_views.logout_view,         name='logout'),
    path('auth/forgot-password/',vault_views.forgot_password_view,name='forgot_password'),
    path('auth/reset-password/', vault_views.reset_password_view, name='reset_password'),
]

urlpatterns = auth_patterns + [
    path('admin/', admin.site.urls),
    path('',       include('vault.urls')),          # namespaced vault: routes
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
