from django.urls import path

from .views import (
    csrf_token_view,
    current_user_view,
    login_view,
    logout_view,
)

app_name = "accounts"

urlpatterns = [
    path("csrf/", csrf_token_view, name="csrf"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("me/", current_user_view, name="current-user"),
]
