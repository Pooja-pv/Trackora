import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_GET, require_POST


@require_GET
@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
@csrf_protect
def login_view(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return JsonResponse(
            {"detail": "Username and password are required."},
            status=400,
        )

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return JsonResponse(
            {"detail": "Invalid username or password."},
            status=400,
        )

    if not user.is_active:
        return JsonResponse(
            {"detail": "This account is inactive."},
            status=403,
        )

    login(request, user)

    return JsonResponse(
        {
            "id": user.id,
            "username": user.get_username(),
            "email": user.email,
        }
    )


@require_POST
@csrf_protect
def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Logged out successfully."})


@require_GET
def current_user_view(request):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"detail": "Authentication required."},
            status=401,
        )

    return JsonResponse(
        {
            "id": request.user.id,
            "username": request.user.get_username(),
            "email": request.user.email,
        }
    )
