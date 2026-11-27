from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('teacher', '0004_student_lms_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='student',
            name='gender',
            field=models.CharField(blank=True, choices=[('boy', 'Boy'), ('girl', 'Girl')], default='', max_length=10),
        ),
    ]
