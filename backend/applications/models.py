
from django.conf import settings
from django.db import models


class JobApplication(models.Model):
    class Status(models.TextChoices):
        SAVED = "saved", "Saved"
        APPLIED = "applied", "Applied"
        ASSESSMENT = "assessment", "Assessment"
        INTERVIEW = "interview", "Interview"
        OFFER = "offer", "Offer"
        REJECTED = "rejected", "Rejected"
        WITHDRAWN = "withdrawn", "Withdrawn"

    class WorkMode(models.TextChoices):
        ONSITE = "onsite", "On-site"
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="job_applications",
    )
    company_name = models.CharField(max_length=200)
    job_title = models.CharField(max_length=200)
    job_url = models.URLField(max_length=2000, blank=True)
    location = models.CharField(max_length=200, blank=True)
    work_mode = models.CharField(
        max_length=20,
        choices=WorkMode.choices,
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SAVED,
    )
    job_description = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    salary_range = models.CharField(max_length=100, blank=True)
    applied_date = models.DateField(null=True, blank=True)
    interview_date = models.DateTimeField(null=True, blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-created_at"]

    def __str__(self):
        return f"{self.job_title} at {self.company_name}"
