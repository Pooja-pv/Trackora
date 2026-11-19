from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({
        "csrfToken": request.META.get("CSRF_COOKIE")
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/csrf/", csrf_token, name="csrf_token"),
    path("api/applications/", include("applications.urls")),

    
    re_path(
        r"^(?!admin/|api/|static/).*",
        TemplateView.as_view(template_name="index.html"),
        name="frontend",
    ),
]
