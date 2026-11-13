import json

from django.contrib.auth import get_user_model
from django.test import TestCase, Client


User = get_user_model()


class AuthenticationAPITests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=False)
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.logout_url = "/api/auth/logout/"
        self.current_user_url = "/api/auth/me/"

    def test_registration_creates_user_and_profile(self):
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                "username": "new_member",
                "email": "new@example.com",
                "full_name": "New Member",
                "password": "SecurePass123!",
                "password_confirmation": "SecurePass123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username="new_member")
        self.assertTrue(user.check_password("SecurePass123!"))
        self.assertEqual(user.profile.full_name, "New Member")

    def test_registration_rejects_invalid_email(self):
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                "username": "new_member",
                "email": "not-an-email",
                "full_name": "New Member",
                "password": "SecurePass123!",
                "password_confirmation": "SecurePass123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username="new_member").exists())

    def test_registration_rejects_mismatched_passwords(self):
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                "username": "new_member",
                "email": "new@example.com",
                "full_name": "New Member",
                "password": "SecurePass123!",
                "password_confirmation": "DifferentPass123!",
            }),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(username="new_member").exists())

    def test_login_and_current_user(self):
        User.objects.create_user(
            username="existing_member",
            email="existing@example.com",
            password="SecurePass123!",
        )

        response = self.client.post(
            self.login_url,
            data=json.dumps({"username": "existing_member", "password": "SecurePass123!"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        current_user = self.client.get(self.current_user_url)
        self.assertEqual(current_user.status_code, 200)
        self.assertEqual(current_user.json()["username"], "existing_member")

    def test_current_user_requires_authentication(self):
        response = self.client.get(self.current_user_url)
        self.assertEqual(response.status_code, 401)

    def test_logout_ends_session(self):
        user = User.objects.create_user(username="member", password="SecurePass123!")
        self.client.force_login(user)

        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get(self.current_user_url).status_code, 401)
