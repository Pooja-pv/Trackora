
import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_GET, require_POST

from .models import UserProfile


User = get_user_model()


@require_GET
@ensure_csrf_cookie
def csrf_token_view(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_POST
@csrf_protect
def register_view(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"detail": "Invalid registration data."}, status=400)

    username = data.get("username", "")
    email = data.get("email", "")
    full_name = data.get("full_name", "")
    password = data.get("password", "")
    password_confirmation = data.get("password_confirmation", "")

    if not all(isinstance(value, str) for value in [
        username, email, full_name, password, password_confirmation
    ]):
        return JsonResponse({"detail": "All fields must be valid text."}, status=400)

    username = username.strip()
    email = email.strip().lower()
    full_name = full_name.strip()

    if not username or not email or not password or not password_confirmation:
        return JsonResponse({"detail": "Please complete all required fields."}, status=400)

    if len(username) > 150:
        return JsonResponse({"detail": "Username is too long."}, status=400)

    if len(full_name) > 150:
        return JsonResponse({"detail": "Full name is too long."}, status=400)

    if password != password_confirmation:
        return JsonResponse({"detail": "Passwords do not match."}, status=400)

    if len(password) < 8:
        return JsonResponse({"detail": "Password must contain at least 8 characters."}, status=400)

    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({"detail": "This username is already taken."}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"detail": "An account with this email already exists."}, status=400)

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )
            UserProfile.objects.create(user=user, full_name=full_name)
    except IntegrityError:
        return JsonResponse(
            {"detail": "An account with these details already exists."},
            status=400,
        )

    return JsonResponse(
        {
            "id": user.id,
            "username": user.get_username(),
            "email": user.email,
            "full_name": full_name,
        },
        status=201,
    )


@require_POST
@csrf_protect
def login_view(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    if not isinstance(data, dict):
        return JsonResponse({"detail": "Invalid login data."}, status=400)

    username = data.get("username", "")
    password = data.get("password", "")

    if not isinstance(username, str) or not isinstance(password, str):
        return JsonResponse({"detail": "Invalid login data."}, status=400)

    username = username.strip()

    if not username or not password:
        return JsonResponse(
            {"detail": "Username and password are required."},
            status=400,
        )

    user = authenticate(request, username=username, password=password)

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
