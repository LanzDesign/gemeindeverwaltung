# Generated migration for flexible categories
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('kalender', '0002_raumbelegung_update'),
    ]

    operations = [
        # Raum kapazitaet default
        migrations.AlterField(
            model_name='raum',
            name='kapazitaet',
            field=models.IntegerField(default=20, help_text='Maximale Anzahl Personen'),
        ),
        # Gemeindetermin: Neue flexible Kategorie hinzufügen
        migrations.AddField(
            model_name='gemeindetermin',
            name='kategorie_neu',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='gemeindetermine', to='kalender.kalenderkategorie', verbose_name='Kategorie'),
        ),
        migrations.AlterField(
            model_name='gemeindetermin',
            name='kategorie',
            field=models.CharField(blank=True, choices=[('intern', 'Intern'), ('extern', 'Extern'), ('allgemein', 'Allgemein'), ('feiertag', 'Feiertag')], default='allgemein', help_text='VERALTET: Wird durch kategorie_neu ersetzt', max_length=20),
        ),
        migrations.AlterField(
            model_name='gemeindetermin',
            name='farbe',
            field=models.CharField(blank=True, default='#ea580c', help_text='Hex-Farbcode (z.B. #ea580c) - wird ignoriert wenn kategorie_neu gesetzt', max_length=7),
        ),
        # Raumbelegung: Neue flexible Kategorie hinzufügen
        migrations.AddField(
            model_name='raumbelegung',
            name='kategorie_neu',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='raumbelegungen', to='kalender.kalenderkategorie', verbose_name='Kategorie'),
        ),
        migrations.AlterField(
            model_name='raumbelegung',
            name='kategorie',
            field=models.CharField(blank=True, choices=[('intern', 'Intern'), ('extern', 'Extern'), ('termin', 'Termin'), ('fest', 'Festgelegt')], default='termin', help_text='VERALTET: Wird durch kategorie_neu ersetzt', max_length=20),
        ),
    ]
