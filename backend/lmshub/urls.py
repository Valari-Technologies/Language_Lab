from django.urls import re_path

from . import views

PKG = r"(?P<package_id>[A-Za-z0-9_-]{1,64})"

urlpatterns = [
    re_path(r"^health/?$", views.health, name="lmshub-health"),
    re_path(r"^pair/?$", views.pair, name="lmshub-pair"),
    re_path(r"^whoami/?$", views.whoami, name="lmshub-whoami"),
    re_path(r"^status/?$", views.status_view, name="lmshub-status"),
    re_path(r"^login/?$", views.login, name="lmshub-login"),
    re_path(r"^heartbeat/?$", views.heartbeat, name="lmshub-heartbeat"),
    re_path(r"^logout/?$", views.logout, name="lmshub-logout"),
    re_path(r"^level-plan/?$", views.level_plan, name="lmshub-level-plan"),
    re_path(rf"^packages/{PKG}/?$", views.student_package, name="lmshub-package"),
    re_path(rf"^device-packages/{PKG}/?$", views.device_package, name="lmshub-device-package"),
    re_path(r"^progress/?$", views.progress_view, name="lmshub-progress"),
    re_path(r"^resume/?$", views.resume, name="lmshub-resume"),
    re_path(rf"^resume/{PKG}/?$", views.resume_delete, name="lmshub-resume-delete"),
    re_path(r"^offline-data/?$", views.offline_data, name="lmshub-offline-data"),
    re_path(r"^offline-progress/?$", views.offline_progress, name="lmshub-offline-progress"),
    re_path(r"^.*$", views.not_found),
]
