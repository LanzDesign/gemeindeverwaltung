# Generated migration

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
            name='KalenderKategorie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('bezeichnung', models.CharField(max_length=100)),
                ('abkuerzung', models.CharField(blank=True, default='', help_text='Abkürzung für Anzeige (z.B. F, U, K)', max_length=10)),
                ('farbe', models.CharField(help_text='Hex-Farbcode (z.B. #ea580c)', max_length=7)),
                ('aktiv', models.BooleanField(default=True)),
                ('sortierung', models.IntegerField(default=0)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Kalender-Kategorie',
                'verbose_name_plural': 'Kalender-Kategorien',
                'ordering': ['sortierung', 'name'],
            },
        ),
        migrations.CreateModel(
            name='MitarbeiterKategorie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('bezeichnung', models.CharField(max_length=100)),
                ('abkuerzung', models.CharField(blank=True, default='', help_text='Abkürzung für Anzeige (z.B. F, U, K)', max_length=10)),
                ('farbe', models.CharField(help_text='Hex-Farbcode (z.B. #ea580c)', max_length=7)),
                ('aktiv', models.BooleanField(default=True)),
                ('sortierung', models.IntegerField(default=0)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Mitarbeiter-Kategorie',
                'verbose_name_plural': 'Mitarbeiter-Kategorien',
                'ordering': ['sortierung', 'name'],
            },
        ),
        migrations.CreateModel(
            name='Mitarbeiter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('vorname', models.CharField(max_length=100)),
                ('nachname', models.CharField(max_length=100)),
                ('urlaubstage_gesamt', models.IntegerField(default=30, help_text='Gesamte Urlaubstage pro Jahr')),
                ('urlaubstage_genommen', models.IntegerField(default=0, help_text='Bereits genommene Urlaubstage')),
                ('aktiv', models.BooleanField(default=True)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='mitarbeiter_profil', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Mitarbeiter',
                'verbose_name_plural': 'Mitarbeiter',
                'ordering': ['nachname', 'vorname'],
            },
        ),
        migrations.CreateModel(
            name='Raum',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('beschreibung', models.TextField(blank=True)),
                ('kapazitaet', models.IntegerField(blank=True, null=True)),
                ('aktiv', models.BooleanField(default=True)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Raum',
                'verbose_name_plural': 'Räume',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Raumbelegung',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titel', models.CharField(max_length=200)),
                ('kontaktperson', models.CharField(blank=True, max_length=100)),
                ('telefon', models.CharField(blank=True, max_length=20)),
                ('teilnehmerzahl', models.IntegerField(blank=True, null=True)),
                ('datum_start', models.DateField()),
                ('datum_ende', models.DateField(blank=True, null=True)),
                ('startzeit', models.TimeField(blank=True, null=True)),
                ('endzeit', models.TimeField(blank=True, null=True)),
                ('wiederholung', models.CharField(choices=[('keine', 'Keine'), ('täglich', 'Täglich'), ('wöchentlich', 'Wöchentlich'), ('monatlich', 'Monatlich')], default='keine', max_length=20)),
                ('wiederholung_bis', models.DateField(blank=True, null=True)),
                ('beschreibung', models.TextField(blank=True)),
                ('farbe', models.CharField(default='#ea580c', help_text='Hex-Farbcode (z.B. #ea580c)', max_length=7)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
                ('kategorie', models.CharField(blank=True, default='termin', max_length=20)),
                ('raum', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='belegungen', to='kalender.raum')),
                ('erstellt_von', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Raumbelegung',
                'verbose_name_plural': 'Raumbelegungen',
                'ordering': ['-datum_start', 'startzeit'],
            },
        ),
        migrations.CreateModel(
            name='Mitarbeitereintrag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('person', models.CharField(blank=True, default='', help_text='Name falls kein Mitarbeiter-Profil', max_length=200)),
                ('datum_start', models.DateField(help_text='Startdatum')),
                ('datum_ende', models.DateField(blank=True, help_text='Enddatum', null=True)),
                ('startzeit', models.TimeField(blank=True, null=True)),
                ('endzeit', models.TimeField(blank=True, null=True)),
                ('ganztaegig', models.BooleanField(default=False)),
                ('halbtags', models.BooleanField(default=False, help_text='Halber Tag (z.B. Vormittag oder Nachmittag)')),
                ('typ', models.CharField(choices=[('termin', 'Termin'), ('krankheit', 'Krankheit'), ('urlaub', 'Urlaub'), ('leitung', 'Leitung'), ('extern', 'Extern'), ('unentschuldigt', 'Unentschuldigt')], default='termin', max_length=20)),
                ('titel', models.CharField(blank=True, default='', max_length=200)),
                ('beschreibung', models.TextField(blank=True)),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
                ('kategorie', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='mitarbeiter_eintraege', to='kalender.mitarbeiterkategorie')),
                ('mitarbeiter', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='eintraege', to='kalender.mitarbeiter')),
                ('erstellt_von', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Mitarbeitereintrag',
                'verbose_name_plural': 'Mitarbeitereinträge',
                'ordering': ['-datum_start', 'startzeit'],
            },
        ),
        migrations.CreateModel(
            name='Gemeindetermin',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titel', models.CharField(max_length=200)),
                ('datum', models.DateField()),
                ('startzeit', models.TimeField()),
                ('endzeit', models.TimeField()),
                ('beschreibung', models.TextField(blank=True)),
                ('kategorie', models.CharField(choices=[('intern', 'Intern'), ('extern', 'Extern'), ('allgemein', 'Allgemein'), ('feiertag', 'Feiertag')], default='allgemein', max_length=20)),
                ('farbe', models.CharField(default='#ea580c', help_text='Hex-Farbcode (z.B. #ea580c)', max_length=7)),
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
    ]
