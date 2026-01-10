# Generated migration for Raumbelegung model updates

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('kalender', '0001_initial'),
    ]

    operations = [
        # Zuerst: Ändere raum von ForeignKey zu ManyToManyField
        # Schritt 1: Erstelle neues temporäres ManyToManyField
        migrations.AddField(
            model_name='raumbelegung',
            name='raum_temp',
            field=models.ManyToManyField(help_text='Räume für diese Buchung', related_name='belegungen_temp', to='kalender.raum'),
        ),
        
        # Schritt 2: Daten migrieren (alte raum ForeignKey -> neue raum_temp ManyToMany)
        migrations.RunPython(
            code=lambda apps, schema_editor: migrate_raum_data(apps, schema_editor),
            reverse_code=migrations.RunPython.noop,
        ),
        
        # Schritt 3: Lösche alte raum ForeignKey
        migrations.RemoveField(
            model_name='raumbelegung',
            name='raum',
        ),
        
        # Schritt 4: Benenne raum_temp zu raum um
        migrations.RenameField(
            model_name='raumbelegung',
            old_name='raum_temp',
            new_name='raum',
        ),
        
        # Mache kontaktperson und telefon zu Pflichtfeldern
        migrations.AlterField(
            model_name='raumbelegung',
            name='kontaktperson',
            field=models.CharField(help_text='Name der Kontaktperson (Pflichtfeld)', max_length=200),
        ),
        migrations.AlterField(
            model_name='raumbelegung',
            name='telefon',
            field=models.CharField(help_text='Telefonnummer (Pflichtfeld)', max_length=20),
        ),
    ]


def migrate_raum_data(apps, schema_editor):
    """
    Migriere vorhandene raum ForeignKey Daten zu raum_temp ManyToMany
    """
    Raumbelegung = apps.get_model('kalender', 'Raumbelegung')
    
    for belegung in Raumbelegung.objects.all():
        if hasattr(belegung, 'raum') and belegung.raum:
            belegung.raum_temp.add(belegung.raum)
