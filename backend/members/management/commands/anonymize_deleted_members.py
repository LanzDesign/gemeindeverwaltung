from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from members.models import Member


class Command(BaseCommand):
    help = 'Anonymisiert Mitglieder, die länger als 30 Tage gelöscht sind (DSGVO-konform)'

    def handle(self, *args, **options):
        # Finde alle Mitglieder, die vor mehr als 30 Tagen gelöscht wurden
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        members_to_anonymize = Member.objects.filter(
            deleted_at__isnull=False,
            deleted_at__lt=thirty_days_ago,
            anonymized_at__isnull=True
        )
        
        count = members_to_anonymize.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('Keine Mitglieder zur Anonymisierung gefunden.'))
            return
        
        self.stdout.write(f'Anonymisiere {count} Mitglied(er)...')
        
        for member in members_to_anonymize:
            original_name = f"{member.last_name}, {member.first_name}"
            member.anonymize()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Anonymisiert: {original_name} (ID: {member.id})'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Erfolgreich {count} Mitglied(er) anonymisiert!'
            )
        )
