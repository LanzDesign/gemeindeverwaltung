# Generated migration file for Kalender models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Gemeindetermin',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titel', models.CharField(max_length=200)),
                ('datum', models.DateField()),
                ('startzeit', models.TimeField()),
                ('endzeit', models.TimeField()),
                ('beschreibung', models.TextField(blank=True)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
                ('erstellt_von', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Gemeindetermin',
                'verbose_name_plural': 'Gemeindetermine',
                'ordering': ['-datum', 'startzeit'],
            },
        ),
        migrations.CreateModel(
            name='Raumbelegung',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('raum', models.CharField(max_length=100)),
                ('titel', models.CharField(max_length=200)),
                ('datum', models.DateField()),
                ('startzeit', models.TimeField()),
                ('endzeit', models.TimeField()),
                ('beschreibung', models.TextField(blank=True)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
                ('erstellt_von', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Raumbelegung',
                'verbose_name_plural': 'Raumbelegungen',
                'ordering': ['-datum', 'raum', 'startzeit'],
            },
        ),
        migrations.CreateModel(
            name='Mitarbeitereintrag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('person', models.CharField(max_length=200)),
                ('datum', models.DateField()),
                ('startzeit', models.TimeField()),
                ('endzeit', models.TimeField()),
                ('typ', models.CharField(choices=[('termin', 'Termin'), ('krankheit', 'Krankheit'), ('urlaub', 'Urlaub')], default='termin', max_length=20)),
                ('titel', models.CharField(max_length=200)),
                ('beschreibung', models.TextField(blank=True)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
                ('erstellt_von', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Mitarbeitereintrag',
                'verbose_name_plural': 'Mitarbeitereinträge',
                'ordering': ['-datum', 'startzeit'],
            },
        ),
    ]
