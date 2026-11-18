from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="jobapplication",
            name="job_url",
            field=models.URLField(blank=True, max_length=2000),
        ),
    ]
