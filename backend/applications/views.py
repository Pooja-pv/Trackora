from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import JobApplication
from .serializers import JobApplicationSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .job_extraction import extract_job_details
class JobApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class JobApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(user=self.request.user)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def ExtractJobDetailsView(request):
    url = request.data.get("url", "")

    if not isinstance(url, str) or not url.strip():
        return Response(
            {"error": "Please provide a job posting URL."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        details = extract_job_details(url.strip())
    except ValueError as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(details, status=status.HTTP_200_OK)