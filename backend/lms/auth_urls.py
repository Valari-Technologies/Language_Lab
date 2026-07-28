from django.urls import path
from lms.sync.views import LMSStudentRollNoAuthAPIView

urlpatterns = [
    # POST /api/v1/lms/auth/student-login/
    path("student-login/", LMSStudentRollNoAuthAPIView.as_view(), name="lms-student-login"),
    path("student-login", LMSStudentRollNoAuthAPIView.as_view()),
]
