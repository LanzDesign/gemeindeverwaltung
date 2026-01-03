# Lizenzanalyse - FECG Lahr Gemeindeverwaltung

**Stand:** 02.01.2026

## 🔍 Zusammenfassung

### ✅ **KEINE KRITISCHEN LIZENZPROBLEME GEFUNDEN**

Die Anwendung verwendet ausschließlich kommerzial-freundliche Open-Source-Lizenzen.

---

## Backend-Abhängigkeiten (Python)

| Package | Version | Lizenz | Status |
|---------|---------|--------|--------|
| **asgiref** | 3.11.0 | BSD-3-Clause | ✅ Sicher |
| **Django** | 4.2.27 | BSD-3-Clause | ✅ Sicher |
| **djangorestframework** | 3.16.1 | BSD | ✅ Sicher |
| **gunicorn** | 23.0.0 | MIT | ✅ Sicher |
| **pillow** | 12.0.0 | HPND (PIL License) | ✅ Sicher |
| **psycopg2-binary** | 2.9.11 | **LGPL mit Exceptions** | ⚠️ Beachten |
| **PyPDF2** | 3.0.1 | BSD-3-Clause | ✅ Sicher |
| **reportlab** | 4.4.6 | BSD | ✅ Sicher |
| **requests** | 2.31.0 | Apache 2.0 | ✅ Sicher |
| **whitenoise** | 6.11.0 | MIT | ✅ Sicher |
| **django-cors-headers** | 4.9.0 | MIT | ✅ Sicher |
| **dj-database-url** | 3.0.1 | BSD-2-Clause | ✅ Sicher |
| **charset-normalizer** | 3.4.4 | MIT | ✅ Sicher |
| **sqlparse** | 0.5.3 | BSD-3-Clause | ✅ Sicher |
| **packaging** | 25.0 | Apache 2.0 / BSD | ✅ Sicher |
| **tzdata** | 2025.2 | Public Domain | ✅ Sicher |

---

## Frontend-Abhängigkeiten (JavaScript/React)

| Package | Version | Lizenz | Status |
|---------|---------|--------|--------|
| **React** | 19.2.0 | MIT | ✅ Sicher |
| **React-DOM** | 19.2.0 | MIT | ✅ Sicher |
| **@mui/material** | 7.3.5 | MIT | ✅ Sicher |
| **@mui/icons-material** | 7.3.5 | MIT | ✅ Sicher |
| **@emotion/react** | 11.14.0 | MIT | ✅ Sicher |
| **@emotion/styled** | 11.14.1 | MIT | ✅ Sicher |
| **@fullcalendar/*** | 6.1.19 | MIT | ✅ Sicher |
| **axios** | 1.13.2 | MIT | ✅ Sicher |
| **react-hook-form** | 7.66.1 | MIT | ✅ Sicher |
| **react-router-dom** | 7.9.6 | MIT | ✅ Sicher |
| **xlsx** | 0.18.5 | Apache-2.0 | ✅ Sicher |
| **vite** | 7.2.4 | MIT | ✅ Sicher |
| **eslint** | 9.39.1 | MIT | ✅ Sicher |

---

## ⚠️ Besondere Beachtung

### **psycopg2-binary - LGPL mit Exceptions**

**Lizenz:** LGPL v3.0 mit Linking-Exception

**Was bedeutet das?**
- Die **PostgreSQL-Bibliothek** (psycopg2) steht unter LGPL
- **Linking-Exception erlaubt** die Verwendung in proprietären Projekten
- Sie dürfen die Software **kommerziell nutzen**, ohne Ihren Code offenlegen zu müssen
- **Bedingungen:**
  - Änderungen an psycopg2 selbst müssen offengelegt werden (was Sie nicht tun)
  - Dynamisches Linking (Python import) ist erlaubt

**Status:** ✅ **Keine Probleme** - Die LGPL-Exception erlaubt kommerzielle Nutzung ohne Offenlegungspflicht

---

## 📊 Lizenz-Übersicht

### Verwendete Lizenzen:

- **MIT License** (Mehrheit): Sehr permissiv, keine Einschränkungen
- **BSD-3-Clause / BSD-2-Clause**: Sehr permissiv, ähnlich wie MIT
- **Apache 2.0**: Permissiv, mit Patent-Klausel
- **LGPL mit Exceptions**: Erlaubt proprietäre Nutzung durch dynamisches Linking
- **Public Domain**: Keine Einschränkungen

### Keine problematischen Lizenzen:
- ❌ Keine GPL-Lizenzen
- ❌ Keine AGPL-Lizenzen
- ❌ Keine Copy-Left-Lizenzen ohne Exceptions

---

## ✅ Fazit

**Die Anwendung ist lizenztechnisch unbedenklich:**

1. **Kommerzielle Nutzung erlaubt** ✅
2. **Keine Offenlegungspflicht des eigenen Codes** ✅
3. **Weiterverteilung möglich** ✅
4. **Modifikationen erlaubt** ✅
5. **Proprietäre Erweiterungen möglich** ✅

### Empfohlene Maßnahmen:

1. ✅ **Lizenztexte beilegen**: Fügen Sie eine `LICENSES.md` oder `THIRD_PARTY_NOTICES.txt` mit allen verwendeten Lizenzen hinzu
2. ✅ **Copyright-Hinweise**: Behalten Sie die Copyright-Hinweise in den Bibliotheken bei (passiert automatisch)
3. ✅ **Dokumentation**: Erwähnen Sie verwendete Open-Source-Komponenten in Ihrer Dokumentation

### Optional (Best Practice):

- Erstellen Sie eine `THIRD_PARTY_LICENSES.txt` mit allen Lizenzhinweisen
- Erwägen Sie ein Tool wie `pip-licenses` (Python) oder `license-checker` (npm) für automatische Berichte

---

## 🔗 Weitere Informationen

**MIT License:** https://opensource.org/licenses/MIT  
**BSD-3-Clause:** https://opensource.org/licenses/BSD-3-Clause  
**Apache 2.0:** https://www.apache.org/licenses/LICENSE-2.0  
**LGPL mit Exceptions:** https://www.gnu.org/licenses/lgpl-3.0.html

---

**Hinweis:** Diese Analyse basiert auf den am 02.01.2026 installierten Versionen. Bei Updates sollten Lizenzen erneut geprüft werden.
