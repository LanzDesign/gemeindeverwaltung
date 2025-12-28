"""
Backup Management für FECG Lahr Mitgliederverwaltung

Erstellt automatische und manuelle Backups der Datenbank
und bietet Download-Funktionalität im Admin-Interface.
"""

import os
import subprocess
from datetime import datetime
from pathlib import Path
from django.conf import settings
from django.core.management import call_command
from io import BytesIO
import zipfile


class BackupManager:
    """Verwaltet Datenbank-Backups"""
    
    def __init__(self):
        self.backup_dir = getattr(settings, 'BACKUP_DIR', Path(settings.BASE_DIR) / 'backups')
        self.backup_dir.mkdir(exist_ok=True)
        
    def create_backup(self, backup_type='full'):
        """
        Erstellt ein Datenbank-Backup
        
        Args:
            backup_type: 'full' (komplette DB) oder 'data' (nur Daten)
        
        Returns:
            Path: Pfad zur Backup-Datei
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"fecg_backup_{backup_type}_{timestamp}.json"
        filepath = self.backup_dir / filename
        
        # Django dumpdata verwenden
        with open(filepath, 'w', encoding='utf-8') as f:
            if backup_type == 'full':
                # Komplette Datenbank
                call_command('dumpdata', stdout=f, indent=2)
            else:
                # Nur members-App Daten
                call_command('dumpdata', 'members', stdout=f, indent=2)
        
        return filepath
    
    def create_sql_backup(self):
        """
        Erstellt ein SQL-Dump (nur für PostgreSQL/MySQL)
        
        Returns:
            Path: Pfad zur SQL-Datei oder None
        """
        db_config = settings.DATABASES['default']
        engine = db_config['ENGINE']
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if 'postgresql' in engine:
            filename = f"fecg_postgres_{timestamp}.sql"
            filepath = self.backup_dir / filename
            
            # PostgreSQL pg_dump
            cmd = [
                'pg_dump',
                '-h', db_config.get('HOST', 'localhost'),
                '-U', db_config['USER'],
                '-d', db_config['NAME'],
                '-f', str(filepath),
                '--no-password'
            ]
            
            # Setze Passwort als Umgebungsvariable
            env = os.environ.copy()
            env['PGPASSWORD'] = db_config['PASSWORD']
            
            try:
                subprocess.run(cmd, env=env, check=True, capture_output=True)
                return filepath
            except subprocess.CalledProcessError as e:
                print(f"SQL-Backup fehlgeschlagen: {e.stderr.decode()}")
                return None
                
        elif 'mysql' in engine:
            filename = f"fecg_mysql_{timestamp}.sql"
            filepath = self.backup_dir / filename
            
            # MySQL mysqldump
            cmd = [
                'mysqldump',
                '-h', db_config.get('HOST', 'localhost'),
                '-u', db_config['USER'],
                f"-p{db_config['PASSWORD']}",
                db_config['NAME'],
                '--result-file', str(filepath)
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                return filepath
            except subprocess.CalledProcessError as e:
                print(f"SQL-Backup fehlgeschlagen: {e.stderr.decode()}")
                return None
        
        elif 'sqlite' in engine:
            # SQLite: Einfach Datei kopieren
            import shutil
            db_path = db_config['NAME']
            filename = f"fecg_sqlite_{timestamp}.db"
            filepath = self.backup_dir / filename
            shutil.copy2(db_path, filepath)
            return filepath
        
        return None
    
    def create_complete_backup(self):
        """
        Erstellt ein komplettes Backup (DB + Media-Files) als ZIP
        
        Returns:
            Path: Pfad zur ZIP-Datei
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"fecg_complete_{timestamp}.zip"
        filepath = self.backup_dir / filename
        
        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # 1. Datenbank-Backup hinzufügen
            db_backup = self.create_backup('full')
            zipf.write(db_backup, db_backup.name)
            
            # 2. Media-Files hinzufügen (Fotos, PDFs, etc.)
            media_root = Path(settings.MEDIA_ROOT)
            if media_root.exists():
                for file_path in media_root.rglob('*'):
                    if file_path.is_file():
                        arcname = file_path.relative_to(media_root.parent)
                        zipf.write(file_path, arcname)
        
        # Temporäres DB-Backup löschen
        if db_backup.exists():
            db_backup.unlink()
        
        return filepath
    
    def list_backups(self):
        """
        Listet alle verfügbaren Backups auf
        
        Returns:
            list: Liste von Backup-Dateien mit Metadaten
        """
        backups = []
        for file_path in self.backup_dir.glob('fecg_*'):
            if file_path.is_file():
                stat = file_path.stat()
                backups.append({
                    'filename': file_path.name,
                    'path': file_path,
                    'size': stat.st_size,
                    'size_mb': round(stat.st_size / (1024 * 1024), 2),
                    'created': datetime.fromtimestamp(stat.st_ctime),
                    'type': self._get_backup_type(file_path.name)
                })
        
        # Sortiere nach Erstellungsdatum (neueste zuerst)
        backups.sort(key=lambda x: x['created'], reverse=True)
        return backups
    
    def _get_backup_type(self, filename):
        """Bestimmt den Backup-Typ anhand des Dateinamens"""
        if 'complete' in filename:
            return 'Komplett (DB + Media)'
        elif 'postgres' in filename or 'mysql' in filename or 'sqlite' in filename:
            return 'SQL-Dump'
        elif 'full' in filename:
            return 'Datenbank (JSON)'
        elif 'data' in filename:
            return 'Nur Daten (JSON)'
        return 'Unbekannt'
    
    def cleanup_old_backups(self, keep_last=10):
        """
        Löscht alte Backups, behält nur die neuesten
        
        Args:
            keep_last: Anzahl der zu behaltenden Backups
        """
        backups = self.list_backups()
        for backup in backups[keep_last:]:
            try:
                backup['path'].unlink()
                print(f"Gelöscht: {backup['filename']}")
            except Exception as e:
                print(f"Fehler beim Löschen von {backup['filename']}: {e}")
