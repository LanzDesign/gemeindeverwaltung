from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from members.models import Member
from members.deletion_certificate import save_deletion_certificate_to_member
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Archiviert gelöschte Mitglieder nach 6 Jahren automatisch'

    def handle(self, *args, **options):
        """
        Sucht nach Mitgliedern, die vor 6 Jahren gelöscht wurden
        und archiviert sie mit Löschzertifikat
        """
        six_years_ago = timezone.now() - timedelta(days=6*365)
        
        # Finde Mitglieder die gelöscht aber NICHT archiviert wurden
        members_to_archive = Member.objects.filter(
            deleted_at__lte=six_years_ago,
            archived_at__isnull=True
        )
        
        count = members_to_archive.count()
        self.stdout.write(f"Gefunden: {count} Mitglieder zum Archivieren")
        
        for member in members_to_archive:
            try:
                # Hole den Admin der das Mitglied gelöscht hat
                admin_user = member.deleted_by
                if not admin_user:
                    # Falls nicht gespeichert, nutze System User
                    admin_user, _ = User.objects.get_or_create(
                        username='system',
                        defaults={'first_name': 'System', 'last_name': 'Admin'}
                    )
                
                # Generiere Löschzertifikat
                save_deletion_certificate_to_member(member, admin_user)
                
                # Markiere als archiviert
                member.archived_at = timezone.now()
                member.archival_reason = f"Automatisch archiviert nach 6 Jahren Löschung ({member.deleted_at.strftime('%d.%m.%Y')})"
                member.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ {member.first_name} {member.last_name} ({member.id}) archiviert"
                    )
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Fehler bei {member.first_name} {member.last_name}: {str(e)}"
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"\n{count} Mitglieder archiviert"
            )
        )

