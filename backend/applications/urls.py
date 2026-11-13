from django.urls import path

from .views import (
    ExtractJobDetailsView,
    JobApplicationDetailView,
    JobApplicationListCreateView,
)

app_name = "applications"

urlpatterns = [
    path("", JobApplicationListCreateView.as_view(), name="list-create"),
    path("extract/", ExtractJobDetailsView, name="extract"),
    path("<int:pk>/", JobApplicationDetailView.as_view(), name="detail"),
]