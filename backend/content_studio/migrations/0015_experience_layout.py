from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content_studio", "0014_experience_submitted_versions"),
    ]

    operations = [
        migrations.AddField(
            model_name="experience",
            name="layout",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Element positions and sizes set in the Runtime Preview layout editor: {zone: {cardType: {elementId: {prop: value}}}}. Goes into experience.json as 'layout'.",
                verbose_name="LMS Layout",
            ),
        ),
    ]
