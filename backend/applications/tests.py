from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from .job_extraction import validate_url
from .models import JobApplication

User = get_user_model()


class JobApplicationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="trackora_user",
            email="trackora@example.com",
            password="TestPassword123!",
        )
        self.other_user = User.objects.create_user(
            username="another_user",
            email="another@example.com",
            password="TestPassword123!",
        )
        self.list_url = "/api/applications/"

    def test_unauthenticated_user_cannot_list_applications(self):
        response = self.client.get(self.list_url)
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_authenticated_user_can_create_application(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            self.list_url,
            {"company_name": "Example Technologies", "job_title": "Python Developer", "status": "applied"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(JobApplication.objects.count(), 1)
        self.assertEqual(JobApplication.objects.first().user, self.user)

    def test_user_only_sees_own_applications(self):
        JobApplication.objects.create(user=self.user, company_name="My Company", job_title="Backend Developer")
        JobApplication.objects.create(user=self.other_user, company_name="Other Company", job_title="Frontend Developer")
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["company_name"], "My Company")

    def test_user_cannot_access_another_users_application(self):
        application = JobApplication.objects.create(
            user=self.other_user, company_name="Private Company", job_title="Software Engineer"
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"{self.list_url}{application.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_can_update_and_delete_own_application(self):
        application = JobApplication.objects.create(
            user=self.user, company_name="Original Co", job_title="Developer"
        )
        self.client.force_authenticate(user=self.user)
        update = self.client.patch(
            f"{self.list_url}{application.id}/", {"status": "interview"}, format="json"
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)
        self.assertEqual(update.data["status"], "interview")

        delete = self.client.delete(f"{self.list_url}{application.id}/")
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(JobApplication.objects.filter(pk=application.pk).exists())


class JobUrlValidationTests(SimpleTestCase):
    def test_rejects_non_http_schemes(self):
        with self.assertRaisesMessage(ValueError, "Only HTTP and HTTPS"):
            validate_url("file:///etc/passwd")

    def test_rejects_embedded_credentials(self):
        with self.assertRaisesMessage(ValueError, "login credentials"):
            validate_url("https://user:password@example.com/jobs/1")

    def test_rejects_loopback_addresses(self):
        with self.assertRaisesMessage(ValueError, "restricted network"):
            validate_url("http://127.0.0.1/jobs/1")

    @patch("applications.job_extraction.socket.getaddrinfo")
    def test_rejects_hostnames_resolving_to_private_addresses(self, getaddrinfo):
        getaddrinfo.return_value = [(None, None, None, None, ("10.0.0.5", 0))]
        with self.assertRaisesMessage(ValueError, "restricted network"):
            validate_url("https://internal.example/jobs/1")
