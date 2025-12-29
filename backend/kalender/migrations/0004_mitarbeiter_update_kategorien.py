# Generated migration

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def update_kategorien(apps, schema_editor):
    """Aktualisiere Kategorien mit Abkürzungen für Mitarbeiterkalender"""
    KalenderKategorie = apps.get_model('kalender', 'KalenderKategorie')
    
    kategorien = [
        {'name': 'feiertag', 'bezeichnung': 'Feiertag', 'abkuerzung': 'F', 'farbe': '#dc2626', 'sortierung': 1},
        {'name': 'urlaub', 'bezeichnung': 'Urlaub', 'abkuerzung': 'U', 'farbe': '#3b82f6', 'sortierung': 2},
        {'name': 'krankheit', 'bezeichnung': 'Krankheit', 'abkuerzung': 'K', 'farbe': '#6b7280', 'sortierung': 3},
        {'name': 'unentschuldigt', 'bezeichnung': 'Unentschuldigt', 'abkuerzung': 'FZ', 'farbe': '#eab308', 'sortierung': 4},
        {'name': 'leitung', 'bezeichnung': 'Leitung', 'abkuerzung': 'Le', 'farbe': '#FFF9C4', 'sortierung': 5},
        {'name': 'intern', 'bezeichnung': 'Intern', 'abkuerzung': 'I', 'farbe': '#f472b6', 'sortierung': 6},
        {'name': 'extern', 'bezeichnung': 'Extern', 'abkuerzung': 'E', 'farbe': '#059669', 'sortierung': 7},
        {'name': 'allgemein', 'bezeichnung': 'Allgemein', 'abkuerzung': 'A', 'farbe': '#ea580c', 'sortierung': 8},
    ]
    
    for kat in kategorien:
        KalenderKategorie.objects.update_or_create(
            name=kat['name'],
            defaults={
                'bezeichnung': kat['bezeichnung'],
                'abkuerzung': kat['abkuerzung'],
                'farbe': kat['farbe'],
                'aktiv': True,
                'sortierung': kat['sortierung']
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('kalender', '0003_kalenderkategorie'),
    ]

    operations = [
        # Mitarbeiter Model
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
        
        # Abkürzung zu KalenderKategorie hinzufügen
        migrations.AddField(
            model_name='kalenderkategorie',
            name='abkuerzung',
            field=models.CharField(blank=True, default='', help_text='Abkürzung für Anzeige (z.B. F, U, K)', max_length=10),
        ),
        
        # Mitarbeitereintrag aktualisieren für Mehrtagestermine
        migrations.RenameField(
            model_name='mitarbeitereintrag',
            old_name='datum',
            new_name='datum_start',
        ),
        migrations.AddField(
            model_name='mitarbeitereintrag',
            name='datum_ende',
            field=models.DateField(blank=True, help_text='Enddatum', null=True),
        ),
        migrations.AddField(
            model_name='mitarbeitereintrag',
            name='ganztaegig',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='mitarbeitereintrag',
            name='mitarbeiter',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='eintraege', to='kalender.mitarbeiter'),
        ),
        migrations.AlterField(
            model_name='mitarbeitereintrag',
            name='startzeit',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='mitarbeitereintrag',
            name='endzeit',
            field=models.TimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='mitarbeitereintrag',
            name='person',
            field=models.CharField(help_text='Name falls kein Mitarbeiter-Profil', max_length=200),
        ),
        
        # Kategorie als ForeignKey
        migrations.RemoveField(
            model_name='mitarbeitereintrag',
            name='farbe',
        ),
        migrations.AlterField(
            model_name='mitarbeitereintrag',
            name='kategorie',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='mitarbeiter_eintraege', to='kalender.kalenderkategorie'),
        ),
        
        # Neue Typ-Optionen
        migrations.AlterField(
            model_name='mitarbeitereintrag',
            name='typ',
            field=models.CharField(choices=[('termin', 'Termin'), ('krankheit', 'Krankheit'), ('urlaub', 'Urlaub'), ('leitung', 'Leitung'), ('extern', 'Extern'), ('unentschuldigt', 'Unentschuldigt')], default='termin', max_length=20),
        ),
        
        # Kategorien aktualisieren
        migrations.RunPython(update_kategorien),
    ]
