# Raumbelegungsplan - Dokumentation

## Übersicht

Der Raumbelegungsplan wurde entsprechend den Anforderungen erweitert und bietet nun alle gewünschten Funktionen für eine effiziente Raumverwaltung.

## Neue Funktionen

### 1. Neuer Raum mit Personenanzahl

- **Button "Neuer Raum"** in der oberen rechten Ecke
- Beim Anlegen eines Raums werden folgende Felder abgefragt:
  - Raumname (Pflichtfeld)
  - Personenanzahl/Kapazität (Pflichtfeld)
  - Beschreibung (optional)
- Räume werden in der Seitenleiste angezeigt

### 2. Excel-ähnlicher Aufbau

- Monatsansicht mit Grid-Layout
- Tagesansicht mit Stunden-Raster (wie Mitarbeiterkalender)
- Übersichtliche Darstellung aller Termine

### 3. Wiederholende Termine

- Option "Wiederholung" im Termin-Dialog:
  - Keine
  - Täglich
  - Wöchentlich
  - Monatlich
- Feld "Wiederholung bis" für Enddatum der Wiederholung
- Wiederholende Termine werden in **Gelb (W)** angezeigt

### 4. Termine nach Stunden

- Tagesansicht zeigt Termine stundenweise (00:00 - 23:00)
- Startzeit und Endzeit für jeden Termin
- Termine können stundengenau geplant werden

### 5. Termine Bearbeiten und Löschen

- **Bearbeiten**: Klick auf Termin öffnet Bearbeitungsdialog
- **Löschen**: Über Icon-Button im Termin oder in der Bearbeitung
- Beide Aktionen erfordern Bestätigung (siehe Punkt 7)

### 6. Pflichtfelder bei Terminanlage

- **Name der Kontaktperson** (Pflichtfeld)
- **Telefonnummer** (Pflichtfeld)
- Validierung beim Speichern
- Fehlermeldungen bei fehlenden Angaben

### 7. Bestätigungsdialoge

- Bei **Bearbeitung**: Bestätigungsdialog mit Info zum Termin
- Bei **Löschen**: Bestätigungsdialog mit Warnung
- Anzeige relevanter Termindetails
- Abbrechen-Option vorhanden

### 8. Tag-Klick mit Optionen

Wenn Sie auf einen Tag klicken, öffnet sich ein Dialog mit zwei Optionen:

- **"Neuer Termin"**:
  - Öffnet Termin-Erstellungsdialog
  - Automatische Überschneidungsprüfung
  - Mehrere Räume gleichzeitig buchbar
- **"Tagesansicht"**:
  - Wechselt zur Tagesansicht
  - Zeigt alle Termine des Tages stundenweise
  - Seitliche Liste aller Tagestermine

### 9. Farbkodierung im Kalender

| Farbe   | Kürzel | Bedeutung                    |
| ------- | ------ | ---------------------------- |
| 🔴 Rot  | F      | **Feiertage**                |
| 🔵 Blau | T      | **Termin** (normale Buchung) |
| 🟡 Gelb | W      | **Wiederholende Termine**    |
| 🟣 Lila | FT     | **Festgelegte Termine**      |

Die Farbkodierung wird automatisch angewendet:

- Feiertage werden aus der Feiertags-Datenbank geladen
- Termine erhalten automatisch die entsprechende Farbe basierend auf Kategorie
- Wiederholende Termine haben Vorrang und werden immer gelb angezeigt

### 10. Mehrfachbuchung mit Überschneidungsprüfung

- **Mehrere Räume gleichzeitig buchbar**:
  - Multi-Select Dropdown für Raumauswahl
  - Beliebig viele Räume pro Buchung
- **Automatische Überschneidungsprüfung**:
  - Prüfung bei jedem Raum einzeln
  - Prüfung von Datum und Zeitraum
  - Bei Konflikt: Detaillierte Fehlermeldung mit:
    - Betroffener Raum
    - Konfliktierender Termin
    - Datum und Uhrzeit des Konflikts
  - Buchung wird verhindert bei Überschneidung

## Technische Implementierung

### Backend (Django)

#### Models ([kalender/models.py](backend/kalender/models.py))

- `Raum`: Model für Räume mit Kapazität
- `Raumbelegung`:
  - ManyToMany-Beziehung zu Räumen (Mehrfachbuchung)
  - Pflichtfelder: kontaktperson, telefon
  - Wiederholungsoptionen
  - Methode `ueberschneidung_pruefung()` für Konfliktprüfung

#### Serializers ([kalender/serializers.py](backend/kalender/serializers.py))

- `RaumbelegungSerializer`:
  - Validierung von Pflichtfeldern
  - Automatische Farbzuweisung
  - Überschneidungsprüfung

#### Views ([kalender/views.py](backend/kalender/views.py))

- `RaumbelegungViewSet`:
  - Create/Update mit Überschneidungsprüfung
  - Detaillierte Fehlerbehandlung

### Frontend (React)

#### Komponente ([components/Raumbelegungsplan.jsx](frontend/src/components/Raumbelegungsplan.jsx))

- Monatsansicht mit Grid-Layout
- Tagesansicht mit Stunden-Raster
- Dialog für Tag-Optionen
- Dialog für Termin-Erstellung/-Bearbeitung
- Dialog für Raum-Erstellung
- Bestätigungsdialoge
- Farbkodierung und Legende

## Installation und Setup

### 1. Backend Migration

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 2. Frontend Integration

Die Komponente muss in Ihre App-Routing integriert werden:

```jsx
import Raumbelegungsplan from "./components/Raumbelegungsplan";

// In Ihrer Router-Konfiguration:
<Route path="/raumbelegungsplan" element={<Raumbelegungsplan />} />;
```

### 3. API-Endpoints

Die folgenden Endpoints sind verfügbar:

- `GET/POST /api/kalender/raeume/` - Räume verwalten
- `GET/POST /api/kalender/raumbelegungen/` - Buchungen verwalten
- `PUT /api/kalender/raumbelegungen/{id}/` - Buchung bearbeiten
- `DELETE /api/kalender/raumbelegungen/{id}/` - Buchung löschen

## Verwendung

### Raum anlegen

1. Klicken Sie auf "Neuer Raum"
2. Geben Sie Raumname und Personenanzahl ein
3. Optional: Beschreibung hinzufügen
4. Klicken Sie auf "Anlegen"

### Termin buchen

1. Klicken Sie auf einen Tag im Kalender
2. Wählen Sie "Neuer Termin"
3. Füllen Sie alle Pflichtfelder aus:
   - Titel
   - Name der Kontaktperson
   - Telefonnummer
   - Mindestens einen Raum
4. Optional: Wiederholung, Kategorie, Beschreibung
5. Klicken Sie auf "Speichern"

### Termin bearbeiten

1. Klicken Sie auf einen bestehenden Termin
2. Ändern Sie die gewünschten Felder
3. Bestätigen Sie die Änderungen

### Termin löschen

1. Klicken Sie auf das Löschen-Icon eines Termins
2. Bestätigen Sie die Löschung

### Tagesansicht öffnen

1. Klicken Sie auf einen Tag
2. Wählen Sie "Tagesansicht"
3. Alle Termine werden stundenweise angezeigt

## Best Practices

1. **Mehrfachbuchung**: Wählen Sie nur die Räume aus, die Sie wirklich benötigen
2. **Pflichtfelder**: Stellen Sie sicher, dass Kontaktperson und Telefon ausgefüllt sind
3. **Wiederholende Termine**: Setzen Sie ein Enddatum für wiederholende Termine
4. **Überschneidungen**: Das System verhindert automatisch Doppelbuchungen
5. **Farbkodierung**: Nutzen Sie die Legende zur Orientierung

## Troubleshooting

### Fehler: "Überschneidung gefunden"

- Prüfen Sie, ob der Raum zum gewünschten Zeitpunkt bereits gebucht ist
- Wählen Sie einen anderen Raum oder eine andere Zeit

### Fehler: "Pflichtfeld fehlt"

- Stellen Sie sicher, dass Name und Telefonnummer ausgefüllt sind
- Mindestens ein Raum muss ausgewählt sein

### Termin wird nicht angezeigt

- Aktualisieren Sie die Seite (F5)
- Prüfen Sie, ob Sie im richtigen Monat sind
- Prüfen Sie die Datumsfilter

## Zukünftige Erweiterungen

Mögliche weitere Features:

- Export als PDF/Excel
- E-Mail-Benachrichtigungen
- Raum-Filter in der Kalenderansicht
- Statistiken zur Raumauslastung
- Raumverwaltung mit Berechtigungen
