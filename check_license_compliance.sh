#!/bin/bash

# Lizenz-Compliance Check Script
# Prüft Code auf problematische Lizenz-Hinweise

echo "=========================================="
echo "LIZENZ-COMPLIANCE CHECK"
echo "=========================================="
echo ""

echo "1. Suche nach Stack Overflow Referenzen..."
grep -r --include="*.py" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  -E "stackoverflow\.com|stack overflow" . 2>/dev/null | head -20

echo ""
echo "2. Suche nach GitHub Code-Referenzen..."
grep -r --include="*.py" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  -E "github\.com/[^/]+/[^/]+|gist\.github" . 2>/dev/null | head -20

echo ""
echo "3. Suche nach 'copied from' oder 'based on'..."
grep -r --include="*.py" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  -iE "copied from|based on|adapted from|borrowed from" . 2>/dev/null | head -20

echo ""
echo "4. Suche nach GPL/LGPL Hinweisen im Code..."
grep -r --include="*.py" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  -iE "GPL|LGPL|GNU General Public License" . 2>/dev/null | head -20

echo ""
echo "5. Suche nach Copyright-Hinweisen (außer eigene)..."
grep -r --include="*.py" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  -E "Copyright \(c\)|©" . 2>/dev/null | head -20

echo ""
echo "=========================================="
echo "PRÜFUNG ABGESCHLOSSEN"
echo "=========================================="
echo ""
echo "HINWEIS: Wenn Treffer gefunden wurden, prüfen Sie diese manuell!"
echo "Stack Overflow Code steht unter CC BY-SA 4.0 (Share-Alike Lizenz)"
echo ""
