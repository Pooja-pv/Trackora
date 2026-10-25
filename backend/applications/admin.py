
from django.contrib import admin

from .models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "job_title",
        "company_name",
        "user",
        "status",
        "work_mode",
        "updated_at",
    )
    list_filter = ("status", "work_mode", "created_at")
    search_fields = (
        "job_title",
        "company_name",
        "user__username",
        "user__email",
    )
    readonly_fields = ("created_at", "updated_at")
