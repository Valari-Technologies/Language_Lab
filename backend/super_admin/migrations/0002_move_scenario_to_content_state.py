from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('super_admin', '0001_initial'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[migrations.DeleteModel(name='ScenarioBuilder')],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[migrations.DeleteModel(name='Scenario')],
        ),
    ]
