from django.db import migrations, models


def boy_girl_to_male_female(apps, schema_editor):
    Student = apps.get_model('teacher', 'Student')
    Student.objects.filter(gender='boy').update(gender='male')
    Student.objects.filter(gender='girl').update(gender='female')


def male_female_to_boy_girl(apps, schema_editor):
    Student = apps.get_model('teacher', 'Student')
    Student.objects.filter(gender='male').update(gender='boy')
    Student.objects.filter(gender='female').update(gender='girl')


class Migration(migrations.Migration):

    dependencies = [
        ('teacher', '0005_student_gender'),
    ]

    operations = [
        migrations.AlterField(
            model_name='student',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female')], default='', max_length=10),
        ),
        migrations.RunPython(boy_girl_to_male_female, male_female_to_boy_girl),
    ]
