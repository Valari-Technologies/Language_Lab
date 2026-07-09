import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


MOVED_MODELS = ["teacher", "class", "teacherclass"]


def repoint_content_types_to_school_admin(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    ContentType.objects.filter(app_label="core", model__in=MOVED_MODELS).update(app_label="school_admin")


def repoint_content_types_to_core(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    ContentType.objects.filter(app_label="school_admin", model__in=MOVED_MODELS).update(app_label="core")


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0002_move_models_out_of_core_state'),
        ('super_admin', '0001_initial'),
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='Teacher',
                    fields=[
                        ('teacher_id', models.AutoField(primary_key=True, serialize=False)),
                        ('qualification', models.CharField(blank=True, max_length=150, null=True)),
                        ('experience_years', models.IntegerField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='super_admin.school')),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'db_table': 'cms_teacher',
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='Class',
                    fields=[
                        ('class_id', models.AutoField(primary_key=True, serialize=False)),
                        ('class_name', models.CharField(max_length=100)),
                        ('academic_year', models.CharField(max_length=20)),
                        ('is_active', models.BooleanField(default=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='super_admin.school')),
                        ('grade', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='super_admin.grade')),
                    ],
                    options={
                        'db_table': 'cms_class',
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='TeacherClass',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='school_admin.teacher')),
                        ('class_obj', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='school_admin.class')),
                    ],
                    options={
                        'db_table': 'cms_teacherclass',
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddConstraint(
                    model_name='teacherclass',
                    constraint=models.UniqueConstraint(fields=('teacher', 'class_obj'), name='unique_teacher_class'),
                ),
            ],
        ),
        migrations.RunPython(
            repoint_content_types_to_school_admin,
            reverse_code=repoint_content_types_to_core,
        ),
    ]
