import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def repoint_content_types_to_teacher(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    ContentType.objects.filter(app_label="core", model="student").update(app_label="teacher")


def repoint_content_types_to_core(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    ContentType.objects.filter(app_label="teacher", model="student").update(app_label="core")


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('super_admin', '0001_initial'),
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Student',
            fields=[
                ('student_id', models.AutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='super_admin.school')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'cms_student',
            },
        ),
        migrations.RunPython(
            repoint_content_types_to_teacher,
            reverse_code=repoint_content_types_to_core,
        ),
    ]
