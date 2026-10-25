from rest_framework import serializers

from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = [
            "id",
            "company_name",
            "job_title",
            "job_url",
            "location",
            "work_mode",
            "status",
            "job_description",
            "notes",
            "salary_range",
            "applied_date",
            "interview_date",
            "follow_up_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
