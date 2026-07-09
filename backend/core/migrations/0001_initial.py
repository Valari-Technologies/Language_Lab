import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


MOVED_MODELS = [
    "grade",
    "scenario",
    "scenariobuilder",
    "publishcontent",
    "school",
    "schooladminprofile",
    "teacher",
    "student",
    "class",
    "teacherclass",
]


def repoint_content_types_to_core(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    ContentType.objects.filter(app_label="cms", model__in=MOVED_MODELS).update(app_label="core")


def repoint_content_types_to_cms(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    ContentType.objects.filter(app_label="core", model__in=MOVED_MODELS).update(app_label="cms")


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cms', '0009_move_models_to_core_state'),
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='Grade',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('grade_name', models.CharField(help_text='Unique name identifying the grade level (up to 50 characters).', max_length=50, unique=True, verbose_name='Grade Name')),
                        ('description', models.TextField(blank=True, help_text='A detailed description of the grade requirements or standards.', null=True, verbose_name='Description')),
                        ('sort_order', models.IntegerField(help_text='Defines the sequence in which grades are listed.', verbose_name='Sort Order')),
                        ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                        ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                    ],
                    options={
                        'verbose_name': 'Grade',
                        'verbose_name_plural': 'Grades',
                        'ordering': ['sort_order', 'grade_name'],
                        'db_table': 'cms_grade',
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='School',
                    fields=[
                        ('school_id', models.AutoField(primary_key=True, serialize=False)),
                        ('school_name', models.CharField(max_length=150)),
                        ('address', models.CharField(max_length=255)),
                        ('phone', models.CharField(max_length=20)),
                        ('email', models.CharField(max_length=100)),
                        ('logo', models.CharField(blank=True, max_length=255, null=True)),
                        ('is_active', models.BooleanField(default=True)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                    ],
                    options={
                        'db_table': 'cms_school',
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='SchoolAdminProfile',
                    fields=[
                        ('profile_id', models.AutoField(primary_key=True, serialize=False)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.school')),
                        ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='school_admin_profile', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'db_table': 'cms_schooladminprofile',
                    },
                ),
            ],
        ),
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
                        ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.school')),
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
                    name='Student',
                    fields=[
                        ('student_id', models.AutoField(primary_key=True, serialize=False)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.school')),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'db_table': 'cms_student',
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
                        ('school', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.school')),
                        ('grade', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.grade')),
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
                    name='Scenario',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('title', models.CharField(help_text='The title of the scenario.', max_length=200, verbose_name='Title')),
                        ('description', models.TextField(blank=True, help_text='Detailed information about the scenario.', null=True, verbose_name='Description')),
                        ('objective', models.TextField(blank=True, help_text='Pedagogical goals of this scenario.', null=True, verbose_name='Objective')),
                        ('estimated_duration', models.IntegerField(help_text='Estimated time to complete the scenario (in minutes).', verbose_name='Estimated Duration')),
                        ('difficulty', models.CharField(choices=[('EASY', 'Easy'), ('MEDIUM', 'Medium'), ('HARD', 'Hard')], default='MEDIUM', help_text='Complexity rating of the learning material.', max_length=20, verbose_name='Difficulty')),
                        ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('REVIEW', 'Review'), ('TESTING', 'Testing'), ('PUBLISHED', 'Published')], default='DRAFT', help_text='Lifecycle state of the scenario.', max_length=20, verbose_name='Status')),
                        ('thumbnail', models.URLField(blank=True, help_text='URL link to the cover/thumbnail image.', max_length=255, null=True, verbose_name='Thumbnail URL')),
                        ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                        ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                        ('grade', models.ForeignKey(help_text='The grade/level this scenario belongs to.', on_delete=django.db.models.deletion.CASCADE, related_name='scenarios', to='core.grade', verbose_name='Grade')),
                    ],
                    options={
                        'verbose_name': 'Scenario',
                        'verbose_name_plural': 'Scenarios',
                        'ordering': ['grade', '-created_at'],
                        'db_table': 'cms_scenario',
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='ScenarioBuilder',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('block_type', models.CharField(choices=[('VIDEO', 'Video'), ('STORY', 'Story'), ('AUDIO', 'Audio'), ('VOCABULARY', 'Vocabulary'), ('GRAMMAR_GAME', 'Grammar Game'), ('SPEAKING', 'Speaking'), ('WRITING', 'Writing'), ('MCQ', 'Multiple Choice Question'), ('SUMMARY', 'Summary')], help_text='The type of content or activity block.', max_length=30, verbose_name='Block Type')),
                        ('title', models.CharField(help_text='Title of this step.', max_length=200, verbose_name='Title')),
                        ('content', models.TextField(blank=True, help_text='The body content, story text, or instruction.', null=True, verbose_name='Content')),
                        ('media_url', models.URLField(blank=True, help_text='URL link to external video, audio, or image media.', max_length=255, null=True, verbose_name='Media URL')),
                        ('display_order', models.IntegerField(help_text='Sequence in which this step is displayed within the scenario.', verbose_name='Display Order')),
                        ('settings', models.JSONField(blank=True, help_text='Dynamic configuration settings for the block (JSON).', null=True, verbose_name='Settings')),
                        ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                        ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                        ('scenario', models.ForeignKey(help_text='The scenario this step belongs to.', on_delete=django.db.models.deletion.CASCADE, related_name='scenario_builders', to='core.scenario', verbose_name='Scenario')),
                    ],
                    options={
                        'verbose_name': 'Scenario Builder',
                        'verbose_name_plural': 'Scenario Builders',
                        'ordering': ['display_order'],
                        'db_table': 'cms_scenariobuilder',
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddConstraint(
                    model_name='scenariobuilder',
                    constraint=models.UniqueConstraint(fields=('scenario', 'display_order'), name='unique_step_display_order_per_scenario'),
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.CreateModel(
                    name='PublishContent',
                    fields=[
                        ('publish_id', models.AutoField(primary_key=True, serialize=False, verbose_name='Publish ID')),
                        ('release_name', models.CharField(help_text="e.g., 'Grade 6 - July Release'", max_length=100, verbose_name='Release Name')),
                        ('total_scenarios', models.IntegerField(help_text='Number of scenarios included', verbose_name='Total Scenarios')),
                        ('published_at', models.DateTimeField(blank=True, help_text='Publish date and time', null=True, verbose_name='Published At')),
                        ('status', models.CharField(choices=[('DRAFT', 'Draft'), ('PUBLISHED', 'Published'), ('ARCHIVED', 'Archived')], default='DRAFT', max_length=20, verbose_name='Status')),
                        ('export_file', models.CharField(blank=True, help_text='Path to generated export package (ZIP/JSON)', max_length=255, null=True, verbose_name='Export File')),
                        ('checksum', models.CharField(blank=True, help_text='Integrity verification hash', max_length=64, null=True, verbose_name='Checksum')),
                        ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                        ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                        ('grade', models.ForeignKey(db_column='grade_id', on_delete=django.db.models.deletion.CASCADE, related_name='publish_contents', to='core.grade', verbose_name='Grade')),
                        ('published_by', models.ForeignKey(db_column='published_by', on_delete=django.db.models.deletion.CASCADE, related_name='published_contents', to=settings.AUTH_USER_MODEL, verbose_name='Published By')),
                    ],
                    options={
                        'verbose_name': 'Publish Content',
                        'verbose_name_plural': 'Publish Contents',
                        'ordering': ['-created_at'],
                        'db_table': 'cms_publishcontent',
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
                        ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.teacher')),
                        ('class_obj', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.class')),
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
            repoint_content_types_to_core,
            reverse_code=repoint_content_types_to_cms,
        ),
    ]
