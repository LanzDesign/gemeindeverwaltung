from django.core.management.base import BaseCommand
from kalender.models import MitarbeiterKategorie


class Command(BaseCommand):
    help = 'Initialisiert vordefinierte Mitarbeiter-Kategorien'

    def handle(self, *args, **options):
        kategorien = [
            {'name': 'feiertag', 'bezeichnung': 'Feiertag', 'abkuerzung': 'F', 'farbe': '#dc2626', 'sortierung': 1},
            {'name': 'urlaub', 'bezeichnung': 'Urlaub', 'abkuerzung': 'U', 'farbe': '#3b82f6', 'sortierung': 2},
            {'name': 'krankheit', 'bezeichnung': 'Krankheit', 'abkuerzung': 'K', 'farbe': '#6b7280', 'sortierung': 3},
            {'name': 'freizeit', 'bezeichnung': 'Freizeit', 'abkuerzung': 'FZ', 'farbe': '#eab308', 'sortierung': 4},
            {'name': 'leitung', 'bezeichnung': 'Leitung', 'abkuerzung': 'Le', 'farbe': '#fef08a', 'sortierung': 5},
            {'name': 'extern', 'bezeichnung': 'Extern', 'abkuerzung': 'E', 'farbe': '#22c55e', 'sortierung': 6},
            {'name': 'intern', 'bezeichnung': 'Intern', 'abkuerzung': 'I', 'farbe': '#ec4899', 'sortierung': 7},
            {'name': 'allgemein', 'bezeichnung': 'Allgemein', 'abkuerzung': 'A', 'farbe': '#f97316', 'sortierung': 8},
        ]

        created_count = 0
        for kat_data in kategorien:
            _, created = MitarbeiterKategorie.objects.get_or_create(
                name=kat_data['name'],
                defaults=kat_data
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'✓ {kat_data["bezeichnung"]} ({kat_data["abkuerzung"]})'))
            else:
                self.stdout.write(f'  {kat_data["bezeichnung"]} existiert bereits')

        self.stdout.write(self.style.SUCCESS(f'\n{created_count} neue Kategorien erstellt'))
