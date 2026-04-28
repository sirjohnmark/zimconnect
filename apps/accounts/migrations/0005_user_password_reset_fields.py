from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_deleted_at_user_deleted_by_user_is_deleted'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='password_reset_token',
            field=models.CharField(blank=True, default='', max_length=128),
        ),
        migrations.AddField(
            model_name='user',
            name='password_reset_expires_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
