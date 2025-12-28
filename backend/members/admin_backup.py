"""
Django Admin Backup Integration

Fügt dem Admin-Interface Backup-Funktionen hinzu:
- Download-Button für Backups
- Liste aller Backups
- Backup erstellen
"""

from django.contrib import admin
from django.urls import path
from django.http import FileResponse, JsonResponse
from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from members.backup_manager import BackupManager
from django.utils.html import format_html
from django.contrib import messages


class BackupAdminView:
    """Admin-View für Backup-Verwaltung"""
    
    @staticmethod
    @staff_member_required
    def backup_dashboard(request):
        """Zeigt Backup-Dashboard im Admin"""
        manager = BackupManager()
        
        # Backup erstellen wenn gewünscht
        if request.method == 'POST':
            backup_type = request.POST.get('backup_type', 'full')
            try:
                if backup_type == 'sql':
                    backup_file = manager.create_sql_backup()
                elif backup_type == 'complete':
                    backup_file = manager.create_complete_backup()
                else:
                    backup_file = manager.create_backup(backup_type)
                
                if backup_file:
                    messages.success(request, f'Backup erfolgreich erstellt: {backup_file.name}')
                else:
                    messages.error(request, 'Backup konnte nicht erstellt werden')
            except Exception as e:
                messages.error(request, f'Fehler: {str(e)}')
        
        backups = manager.list_backups()
        
        context = {
            'backups': backups,
            'title': 'Datenbank-Backups',
            'site_title': 'FECG Admin',
            'has_permission': True,
        }
        
        return render(request, 'admin/backup_dashboard.html', context)
    
    @staticmethod
    @staff_member_required
    def download_backup(request, filename):
        """Download eines Backups"""
        manager = BackupManager()
        backup_path = manager.backup_dir / filename
        
        if not backup_path.exists():
            return JsonResponse({'error': 'Backup nicht gefunden'}, status=404)
        
        # Sicherheitscheck: Nur Dateien im Backup-Verzeichnis
        if not str(backup_path.resolve()).startswith(str(manager.backup_dir.resolve())):
            return JsonResponse({'error': 'Ungültiger Pfad'}, status=403)
        
        return FileResponse(
            open(backup_path, 'rb'),
            as_attachment=True,
            filename=filename
        )
    
    @staticmethod
    @staff_member_required
    def delete_backup(request, filename):
        """Löscht ein Backup"""
        if request.method != 'POST':
            return JsonResponse({'error': 'Nur POST erlaubt'}, status=405)
        
        manager = BackupManager()
        backup_path = manager.backup_dir / filename
        
        if not backup_path.exists():
            return JsonResponse({'error': 'Backup nicht gefunden'}, status=404)
        
        # Sicherheitscheck
        if not str(backup_path.resolve()).startswith(str(manager.backup_dir.resolve())):
            return JsonResponse({'error': 'Ungültiger Pfad'}, status=403)
        
        try:
            backup_path.unlink()
            return JsonResponse({'success': True, 'message': 'Backup gelöscht'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


# URL-Patterns für Admin (werden unter /admin/backups/ eingebunden)
backup_urlpatterns = [
    path('', BackupAdminView.backup_dashboard, name='backup_dashboard'),
    path('download/<str:filename>/', BackupAdminView.download_backup, name='backup_download'),
    path('delete/<str:filename>/', BackupAdminView.delete_backup, name='backup_delete'),
]
