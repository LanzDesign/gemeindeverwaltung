from django.core.management.base import BaseCommand
from kalender.models import Mitarbeitereintrag


class Command(BaseCommand):
    help = 'Löscht alle Mitarbeitereinträge'

    def handle(self, *args, **options):
        count = Mitarbeitereintrag.objects.count()
        Mitarbeitereintrag.objects.all().delete()
        self.stdout.write(self.style.SUCCESS(f'Gelöscht: {count} Einträge'))
