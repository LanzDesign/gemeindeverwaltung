from django.core.management.base import BaseCommand
from django.utils import timezone
from kalender.models import KalenderKategorie
import requests
from datetime import datetime


class Command(BaseCommand):
    help = 'Importiert Feiertage von api-feiertage.de für Baden-Württemberg'

    def add_arguments(self, parser):
        parser.add_argument(
            '--jahr',
            type=int,
            default=timezone.now().year,
            help='Jahr für das die Feiertage importiert werden sollen'
        )

    def handle(self, *args, **options):
        jahr = options['jahr']
        bundesland = 'BW'  # Baden-Württemberg
        
        self.stdout.write(f'Lade Feiertage für {jahr} in {bundesland}...')
        
        try:
            # API-Aufruf
            url = f'https://www.api-feiertage.de?jahre={jahr}&nur_land={bundesland}'
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            # Feiertag-Kategorie sicherstellen
            feiertag_kat, created = KalenderKategorie.objects.get_or_create(
                name='feiertag',
                defaults={
                    'bezeichnung': 'Feiertag',
                    'abkuerzung': 'F',
                    'farbe': '#dc2626',
                    'aktiv': True,
                    'sortierung': 1
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS('Feiertag-Kategorie erstellt'))
            
            # Feiertage verarbeiten
            feiertage_data = data.get('feiertage', [])
            count = 0
            
            for feiertag in feiertage_data:
                name = feiertag.get('fname', '')
                datum_str = feiertag.get('date', '')
                
                if name and datum_str:
                    # Datum parsen
                    datum = datetime.strptime(datum_str, '%Y-%m-%d').date()
                    
                    self.stdout.write(f'  - {datum}: {name}')
                    count += 1
            
            self.stdout.write(self.style.SUCCESS(f'\n✓ {count} Feiertage für {jahr} gefunden'))
            self.stdout.write(self.style.WARNING('\nHinweis: Feiertage werden automatisch im Kalender angezeigt.'))
            self.stdout.write(self.style.WARNING('Sie müssen nicht manuell als Einträge erstellt werden.'))
            
        except requests.RequestException as e:
            self.stdout.write(self.style.ERROR(f'Fehler beim Laden der Feiertage: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Unerwarteter Fehler: {e}'))
