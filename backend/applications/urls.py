from django.urls import path

from .views import JobApplicationDetailView, JobApplicationListCreateView

app_name = "applications"

urlpatterns = [
    path("", JobApplicationListCreateView.as_view(), name="list-create"),
    path("<int:pk>/", JobApplicationDetailView.as_view(), name="detail"),
]
