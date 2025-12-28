from django.core.management.base import BaseCommand
from members.backup_manager import BackupManager
from django.conf import settings


class Command(BaseCommand):
    help = 'Erstellt ein automatisches Backup der Datenbank'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            default='full',
            choices=['full', 'data', 'sql', 'complete'],
            help='Backup-Typ: full (JSON), data (nur Daten), sql (SQL-Dump), complete (DB + Media)'
        )
        parser.add_argument(
            '--cleanup',
            action='store_true',
            help='Alte Backups aufräumen (behält nur die neuesten 10)'
        )

    def handle(self, *args, **options):
        backup_type = options['type']
        cleanup = options['cleanup']
        
        manager = BackupManager()
        
        self.stdout.write(self.style.WARNING(f'Erstelle {backup_type}-Backup...'))
        
        try:
            if backup_type == 'sql':
                backup_file = manager.create_sql_backup()
                if not backup_file:
                    self.stdout.write(self.style.ERROR('SQL-Backup nicht verfügbar für diese Datenbank'))
                    return
            elif backup_type == 'complete':
                backup_file = manager.create_complete_backup()
            else:
                backup_file = manager.create_backup(backup_type)
            
            self.stdout.write(self.style.SUCCESS(f'✓ Backup erstellt: {backup_file}'))
            
            # Zeige Dateigröße
            size_mb = backup_file.stat().st_size / (1024 * 1024)
            self.stdout.write(f'  Größe: {size_mb:.2f} MB')
            
            # Cleanup wenn gewünscht
            if cleanup:
                self.stdout.write('\nRäume alte Backups auf...')
                manager.cleanup_old_backups(keep_last=10)
                self.stdout.write(self.style.SUCCESS('✓ Cleanup abgeschlossen'))
            
            # Zeige alle Backups
            self.stdout.write('\nVerfügbare Backups:')
            for backup in manager.list_backups()[:5]:  # Zeige nur neueste 5
                self.stdout.write(
                    f"  • {backup['filename']} ({backup['size_mb']} MB) - {backup['created'].strftime('%d.%m.%Y %H:%M')}"
                )
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Fehler beim Backup: {str(e)}'))
            import traceback
            traceback.print_exc()
