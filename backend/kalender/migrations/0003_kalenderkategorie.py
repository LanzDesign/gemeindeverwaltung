# Generated migration

from django.db import migrations, models


def create_default_categories(apps, schema_editor):
    """Erstelle Standard-Kategorien"""
    KalenderKategorie = apps.get_model('kalender', 'KalenderKategorie')
    
    kategorien = [
        {'name': 'intern', 'bezeichnung': 'Intern', 'farbe': '#f472b6', 'sortierung': 1},
        {'name': 'extern', 'bezeichnung': 'Extern', 'farbe': '#059669', 'sortierung': 2},
        {'name': 'allgemein', 'bezeichnung': 'Allgemein', 'farbe': '#ea580c', 'sortierung': 3},
        {'name': 'feiertag', 'bezeichnung': 'Feiertag', 'farbe': '#dc2626', 'sortierung': 4},
    ]
    
    for kat in kategorien:
        KalenderKategorie.objects.get_or_create(
            name=kat['name'],
            defaults={
                'bezeichnung': kat['bezeichnung'],
                'farbe': kat['farbe'],
                'aktiv': True,
                'sortierung': kat['sortierung']
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        ('kalender', '0002_alter_mitarbeitereintrag_options_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='KalenderKategorie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('bezeichnung', models.CharField(max_length=100)),
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
        migrations.RunPython(create_default_categories),
    ]
