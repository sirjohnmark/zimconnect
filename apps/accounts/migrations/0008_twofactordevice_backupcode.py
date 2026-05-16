from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_sellerprofile"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="TwoFactorDevice",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("encrypted_secret", models.CharField(blank=True, default="", max_length=512)),
                ("temp_encrypted_secret", models.CharField(blank=True, default="", max_length=512)),
                ("is_enabled", models.BooleanField(db_index=True, default=False)),
                ("enabled_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="totp_device",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "two-factor device",
                "verbose_name_plural": "two-factor devices",
                "db_table": "totp_devices",
            },
        ),
        migrations.CreateModel(
            name="BackupCode",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code_hash", models.CharField(db_index=True, max_length=64)),
                ("is_used", models.BooleanField(db_index=True, default=False)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "user",
                    models.ForeignKey(
                        db_index=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="backup_codes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "backup code",
                "verbose_name_plural": "backup codes",
                "db_table": "backup_codes",
            },
        ),
        migrations.AddIndex(
            model_name="backupcode",
            index=models.Index(fields=["user", "is_used"], name="bc_user_used_idx"),
        ),
    ]
