#!/usr/bin/env python3
"""
Lizenz-Compliance Scanner für Code
Scannt Code-Dateien nach problematischen Mustern
"""

import os
import re
import sys
from pathlib import Path

# Problematische Muster
SUSPICIOUS_PATTERNS = {
    'stackoverflow': r'stackoverflow\.com',
    'github_repo': r'github\.com/[\w-]+/[\w-]+',
    'gist': r'gist\.github\.com',
    'copied_from': r'(copied from|based on|adapted from|borrowed from|source:)',
    'gpl_mention': r'(GPL|LGPL|GNU General Public|copyleft)',
    'license_header': r'(Copyright \(c\)|©\s+\d{4})',
}

# Verdächtige Funktionsnamen (oft von SO)
SUSPICIOUS_FUNCTIONS = [
    'debounce',
    'throttle', 
    'deepClone',
    'flattenArray',
    'shuffleArray',
    'calculateAge',
    'isValidEmail',
    'formatCurrency',
]

# Dateitypen zum Scannen
FILE_EXTENSIONS = ['.py', '.js', '.jsx', '.ts', '.tsx']

# Ausgeschlossene Verzeichnisse
EXCLUDED_DIRS = [
    'node_modules',
    '__pycache__',
    '.git',
    'venv',
    'env',
    'dist',
    'build',
    'staticfiles',
]

class LicenseScanner:
    def __init__(self, root_path):
        self.root_path = Path(root_path)
        self.findings = []
        
    def scan(self):
        """Scannt alle relevanten Dateien"""
        print(f"🔍 Scanne {self.root_path} nach Lizenzproblemen...\n")
        
        for file_path in self._get_files():
            self._scan_file(file_path)
        
        self._print_report()
    
    def _get_files(self):
        """Gibt alle zu scannenden Dateien zurück"""
        for root, dirs, files in os.walk(self.root_path):
            # Ausgeschlossene Verzeichnisse überspringen
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]
            
            for file in files:
                if any(file.endswith(ext) for ext in FILE_EXTENSIONS):
                    yield Path(root) / file
    
    def _scan_file(self, file_path):
        """Scannt eine einzelne Datei"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')
            
            # Prüfe auf verdächtige Muster
            for pattern_name, pattern in SUSPICIOUS_PATTERNS.items():
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    line_content = lines[line_num - 1].strip()
                    
                    self.findings.append({
                        'file': file_path,
                        'line': line_num,
                        'type': pattern_name,
                        'content': line_content,
                        'severity': self._get_severity(pattern_name)
                    })
            
            # Prüfe auf verdächtige Funktionsnamen
            for func_name in SUSPICIOUS_FUNCTIONS:
                pattern = rf'\b(function|def|const|let|var)\s+{func_name}\b'
                matches = re.finditer(pattern, content)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    line_content = lines[line_num - 1].strip()
                    
                    self.findings.append({
                        'file': file_path,
                        'line': line_num,
                        'type': 'suspicious_function',
                        'content': line_content,
                        'severity': 'MEDIUM'
                    })
        
        except Exception as e:
            print(f"❌ Fehler beim Scannen von {file_path}: {e}")
    
    def _get_severity(self, pattern_name):
        """Bestimmt die Schwere des Fundes"""
        if pattern_name in ['stackoverflow', 'copied_from']:
            return 'HIGH'
        elif pattern_name in ['gpl_mention', 'github_repo']:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def _print_report(self):
        """Gibt den Bericht aus"""
        if not self.findings:
            print("✅ Keine verdächtigen Muster gefunden!\n")
            return
        
        # Nach Schwere sortieren
        severity_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
        self.findings.sort(key=lambda x: (severity_order[x['severity']], str(x['file'])))
        
        print(f"\n⚠️  {len(self.findings)} verdächtige Stelle(n) gefunden:\n")
        print("=" * 80)
        
        current_severity = None
        for finding in self.findings:
            if finding['severity'] != current_severity:
                current_severity = finding['severity']
                emoji = '🔴' if current_severity == 'HIGH' else '🟡' if current_severity == 'MEDIUM' else '🟢'
                print(f"\n{emoji} {current_severity} PRIORITY:")
                print("-" * 80)
            
            rel_path = finding['file'].relative_to(self.root_path)
            print(f"\n📄 {rel_path}:{finding['line']}")
            print(f"   Type: {finding['type']}")
            print(f"   Code: {finding['content'][:100]}")
        
        print("\n" + "=" * 80)
        print("\n📝 NÄCHSTE SCHRITTE:")
        print("1. Überprüfen Sie jede HIGH-Priority Stelle manuell")
        print("2. Entfernen Sie Stack Overflow URLs aus Kommentaren")
        print("3. Schreiben Sie verdächtige Funktionen neu (siehe KI_CODE_STACK_OVERFLOW_GUIDE.md)")
        print("4. Dokumentieren Sie die Herkunft von KI-generiertem Code\n")

def main():
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = '.'
    
    scanner = LicenseScanner(path)
    scanner.scan()

if __name__ == '__main__':
    main()
