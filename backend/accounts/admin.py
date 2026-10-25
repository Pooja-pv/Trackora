from django.contrib import admin

from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "full_name", "job_title", "created_at")
    search_fields = ("user__username", "user__email", "full_name")
    list_filter = ("created_at",)

