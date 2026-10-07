"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from django.conf import settings
from django.conf.urls.static import static

from lms.packages.views import LMSPackageListAPIView, LMSPackageDownloadAPIView
from super_admin.views import ActivateServerAPIView, DeactivateServerAPIView, LmsServerCreateAPIView

from lms.sync.views import BootstrapSyncAPIView, LessonsPackageSyncAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/packages/", include("lms.packages.canonical_urls")),
    path("api/progress/", include("lms.sync.canonical_urls")),
    path("api/cms/v1/", include("super_admin.urls")),
    path("api/cms/v1/", include("school_admin.urls")),
    path("api/cms/v1/", include("teacher.urls")),
    path("api/v1/", include("content_studio.urls")),
    path("api/v1/", include("assessments.urls")),
    path("api/lms/", include("lms.urls")),
    path("api/v1/lms/packages/", LMSPackageListAPIView.as_view(), name="lms-v1-packages"),
    path("api/v1/lms/packages/<int:pk>/download/", LMSPackageDownloadAPIView.as_view(), name="lms-v1-package-download"),
    path("api/v1/lms/published-packages/", LMSPackageListAPIView.as_view(), name="lms-published-packages"),
    path("api/v1/lms/sync/", include("lms.sync.urls")),
    path("api/v1/lms/auth/", include("lms.auth_urls")),
    path("api/v1/sync/bootstrap/", BootstrapSyncAPIView.as_view(), name="sync-bootstrap"),
    path("api/v1/sync/lessons/package/", LessonsPackageSyncAPIView.as_view(), name="sync-lessons-package"),
    path("api/v1/licensing/activate-server", ActivateServerAPIView.as_view(), name="activate-server"),
    path("api/v1/licensing/deactivate-server", DeactivateServerAPIView.as_view(), name="deactivate-server"),
    path("api/v1/licensing/create-server", LmsServerCreateAPIView.as_view(), name="create-server"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

import os
import re
import mimetypes
from django.http import HttpResponse, Http404, StreamingHttpResponse
from django.urls import re_path

def ranged_media_serve(request, path):
    fullpath = os.path.join(settings.MEDIA_ROOT, path)
    if not os.path.exists(fullpath) or not os.path.isfile(fullpath):
        raise Http404("File not found")

    content_type, _ = mimetypes.guess_type(fullpath)
    content_type = content_type or 'application/octet-stream'
    file_size = os.path.getsize(fullpath)

    range_header = request.META.get('HTTP_RANGE', '').strip()
    range_match = re.match(r'bytes=(\d+)-(\d+)?', range_header)

    if range_match:
        first_byte = int(range_match.group(1))
        last_byte = int(range_match.group(2)) if range_match.group(2) else file_size - 1
        if first_byte >= file_size:
            return HttpResponse(status=416)
        last_byte = min(last_byte, file_size - 1)
        length = last_byte - first_byte + 1

        def file_iterator(file_name, offset, length, chunk_size=32768):
            with open(file_name, 'rb') as f:
                f.seek(offset)
                remaining = length
                while remaining > 0:
                    read_size = min(chunk_size, remaining)
                    data = f.read(read_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        response = StreamingHttpResponse(
            file_iterator(fullpath, first_byte, length),
            status=206,
            content_type=content_type
        )
        response['Content-Range'] = f'bytes {first_byte}-{last_byte}/{file_size}'
        response['Content-Length'] = str(length)
        response['Accept-Ranges'] = 'bytes'
        return response

    with open(fullpath, 'rb') as f:
        response = HttpResponse(f.read(), content_type=content_type)
    response['Content-Length'] = str(file_size)
    response['Accept-Ranges'] = 'bytes'
    return response

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', ranged_media_serve),
]
