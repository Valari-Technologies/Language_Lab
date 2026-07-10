import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('super_admin', '0002_move_scenario_to_content_state'),
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        # Tables already exist from super_admin.0001_initial — state-only here
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
                        ('grade', models.ForeignKey(help_text='The grade/level this scenario belongs to.', on_delete=django.db.models.deletion.CASCADE, related_name='scenarios', to='super_admin.grade', verbose_name='Grade')),
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
                        ('scenario', models.ForeignKey(help_text='The scenario this step belongs to.', on_delete=django.db.models.deletion.CASCADE, related_name='scenario_builders', to='content.scenario', verbose_name='Scenario')),
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
    ]
