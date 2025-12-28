from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Führt alle Datenschutz-Wartungsaufgaben aus (Anonymisierung und Archivierung)'

    def handle(self, *args, **options):
        """
        Kombiniertes Command für alle Datenschutz-Wartungsaufgaben.
        Kann täglich per Cronjob ausgeführt werden.
        """
        self.stdout.write(self.style.WARNING('=== Datenschutz-Wartung gestartet ===\n'))
        
        # 1. Anonymisiere gelöschte Mitglieder nach 30 Tagen
        self.stdout.write(self.style.SUCCESS('1. Anonymisiere gelöschte Mitglieder (30 Tage)...'))
        call_command('anonymize_deleted_members')
        
        # 2. Archiviere anonymisierte Mitglieder nach 6 Jahren
        self.stdout.write(self.style.SUCCESS('\n2. Archiviere alte Mitglieder (6 Jahre)...'))
        call_command('archive_old_members')
        
        self.stdout.write(self.style.WARNING('\n=== Datenschutz-Wartung abgeschlossen ==='))
