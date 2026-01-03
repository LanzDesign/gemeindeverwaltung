from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class KalenderKategorie(models.Model):
    """Zentrale Kategorie-Verwaltung für alle Kalender"""
    name = models.CharField(max_length=50, unique=True)
    bezeichnung = models.CharField(max_length=100)
    abkuerzung = models.CharField(max_length=10, default='', blank=True, help_text='Abkürzung für Anzeige (z.B. F, U, K)')
    farbe = models.CharField(max_length=7, help_text='Hex-Farbcode (z.B. #ea580c)')
    aktiv = models.BooleanField(default=True)
    sortierung = models.IntegerField(default=0)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sortierung', 'name']
        verbose_name = "Kalender-Kategorie"
        verbose_name_plural = "Kalender-Kategorien"

    def __str__(self):
        return f"{self.bezeichnung} ({self.name})"


class MitarbeiterKategorie(models.Model):
    """Kategorie-Verwaltung für Mitarbeiterkalender (getrennt von Gemeindekalender)"""
    name = models.CharField(max_length=50, unique=True)
    bezeichnung = models.CharField(max_length=100)
    abkuerzung = models.CharField(max_length=10, default='', blank=True, help_text='Abkürzung für Anzeige (z.B. F, U, K)')
    farbe = models.CharField(max_length=7, help_text='Hex-Farbcode (z.B. #ea580c)')
    aktiv = models.BooleanField(default=True)
    sortierung = models.IntegerField(default=0)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sortierung', 'name']
        verbose_name = "Mitarbeiter-Kategorie"
        verbose_name_plural = "Mitarbeiter-Kategorien"

    def __str__(self):
        return f"{self.bezeichnung} ({self.name})"


class Mitarbeiter(models.Model):
    """Mitarbeiter mit Urlaubsverwaltung"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mitarbeiter_profil')
    vorname = models.CharField(max_length=100)
    nachname = models.CharField(max_length=100)
    urlaubstage_gesamt = models.IntegerField(default=30, help_text='Gesamte Urlaubstage pro Jahr')
    urlaubstage_genommen = models.IntegerField(default=0, help_text='Bereits genommene Urlaubstage')
    aktiv = models.BooleanField(default=True)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nachname', 'vorname']
        verbose_name = "Mitarbeiter"
        verbose_name_plural = "Mitarbeiter"

    def __str__(self):
        return f"{self.vorname} {self.nachname}"

    @property
    def urlaubstage_verfuegbar(self):
        return self.urlaubstage_gesamt - self.urlaubstage_genommen

    @property
    def vollstaendiger_name(self):
        return f"{self.vorname} {self.nachname}"


class Gemeindetermin(models.Model):
    """Gemeindetermine (Events der Gemeinde)"""
    KATEGORIE_CHOICES = [
        ('intern', 'Intern'),
        ('extern', 'Extern'),
        ('allgemein', 'Allgemein'),
        ('feiertag', 'Feiertag'),
    ]
    
    titel = models.CharField(max_length=200)
    datum = models.DateField()
    startzeit = models.TimeField()
    endzeit = models.TimeField()
    beschreibung = models.TextField(blank=True)
    kategorie = models.CharField(max_length=20, choices=KATEGORIE_CHOICES, default='allgemein')
    farbe = models.CharField(max_length=7, default='#ea580c', help_text='Hex-Farbcode (z.B. #ea580c)')
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    erstellt_von = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-datum', 'startzeit']
        verbose_name = "Gemeindetermin"
        verbose_name_plural = "Gemeindetermine"

    def __str__(self):
        return f"{self.titel} - {self.datum}"


class Mitarbeitereintrag(models.Model):
    """Mitarbeiterkalender (Termine, Krankheit, Urlaub)"""
    TYP_CHOICES = [
        ('termin', 'Termin'),
        ('krankheit', 'Krankheit'),
        ('urlaub', 'Urlaub'),
        ('leitung', 'Leitung'),
        ('extern', 'Extern'),
        ('unentschuldigt', 'Unentschuldigt'),
    ]

    mitarbeiter = models.ForeignKey(Mitarbeiter, on_delete=models.CASCADE, related_name='eintraege', null=True, blank=True)
    person = models.CharField(max_length=200, blank=True, default='', help_text='Name falls kein Mitarbeiter-Profil')  # Fallback
    datum_start = models.DateField(help_text='Startdatum')
    datum_ende = models.DateField(help_text='Enddatum', null=True, blank=True)
    startzeit = models.TimeField(null=True, blank=True)
    endzeit = models.TimeField(null=True, blank=True)
    ganztaegig = models.BooleanField(default=False)
    halbtags = models.BooleanField(default=False, help_text='Halber Tag (z.B. Vormittag oder Nachmittag)')
    typ = models.CharField(max_length=20, choices=TYP_CHOICES, default='termin')
    titel = models.CharField(max_length=200, blank=True, default='')
    beschreibung = models.TextField(blank=True)
    kategorie = models.ForeignKey(MitarbeiterKategorie, on_delete=models.SET_NULL, null=True, blank=True, related_name='mitarbeiter_eintraege')
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    erstellt_von = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-datum_start', 'startzeit']
        verbose_name = "Mitarbeitereintrag"
        verbose_name_plural = "Mitarbeitereinträge"

    def __str__(self):
        name = self.mitarbeiter.vollstaendiger_name if self.mitarbeiter else self.person
        if self.datum_ende and self.datum_ende != self.datum_start:
            return f"{name} - {self.typ} ({self.datum_start} bis {self.datum_ende})"
        return f"{name} - {self.typ} ({self.datum_start})"

    @property
    def dauer_tage(self):
        """Berechnet die Anzahl der Tage (ohne Feiertage)"""
        from .services import FeiertagService
        from datetime import timedelta
        
        if self.datum_ende and self.datum_ende != self.datum_start:
            # Zähle Arbeitstage (ohne Wochenenden und Feiertage)
            tage_count = 0
            current = self.datum_start
            while current <= self.datum_ende:
                # Prüfe: ist nicht Samstag (5) oder Sonntag (6) und kein Feiertag
                if current.weekday() < 5:  # Mo-Fr
                    if not FeiertagService.ist_feiertag(current):
                        tage_count += 1
                current += timedelta(days=1)
            
            if self.halbtags:
                return tage_count * 0.5
            return tage_count
        return 0.5 if self.halbtags else 1


    def save(self, *args, **kwargs):
        """Berechne Urlaubstage automatisch"""
        # Prüfe, ob es ein Urlaub-Eintrag ist
        is_new = self.pk is None
        old_tage = 0
        old_war_urlaub = False
        
        if not is_new and self.mitarbeiter:
            # Hole alte Version für Vergleich
            try:
                old = Mitarbeitereintrag.objects.get(pk=self.pk)
                # Merke alte Werte
                if old.typ == 'urlaub':
                    old_war_urlaub = True
                    old_tage = old.dauer_tage
            except Mitarbeitereintrag.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Aktualisiere Urlaubstage nach dem Speichern
        if self.mitarbeiter:
            if old_war_urlaub:
                # Ziehe alte Urlaubstage ab
                self.mitarbeiter.urlaubstage_genommen -= old_tage
            
            if self.typ == 'urlaub':
                # Füge neue Urlaubstage hinzu
                neue_tage = self.dauer_tage
                self.mitarbeiter.urlaubstage_genommen += neue_tage
            
            self.mitarbeiter.save()
    
    def delete(self, *args, **kwargs):
        """Ziehe Urlaubstage ab beim Löschen"""
        if self.typ == 'urlaub' and self.mitarbeiter:
            self.mitarbeiter.urlaubstage_genommen -= self.dauer_tage
            self.mitarbeiter.save()
        super().delete(*args, **kwargs)

    # Backward compatibility properties
    @property
    def datum(self):
        return self.datum_start


class Raum(models.Model):
    """Räume für Raumbelegungsplan"""
    name = models.CharField(max_length=100, unique=True)
    beschreibung = models.TextField(blank=True)
    kapazitaet = models.IntegerField(help_text='Maximale Anzahl Personen')
    aktiv = models.BooleanField(default=True)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Raum"
        verbose_name_plural = "Räume"

    def __str__(self):
        return f"{self.name} ({self.kapazitaet} Personen)"


class Raumbelegung(models.Model):
    """Raumbelegungsplan"""
    KATEGORIE_CHOICES = [
        ('intern', 'Intern'),
        ('extern', 'Extern'),
        ('termin', 'Termin'),
        ('fest', 'Festgelegt'),
    ]
    
    raum = models.ForeignKey(Raum, on_delete=models.CASCADE, related_name='belegungen')
    titel = models.CharField(max_length=200)
    kontaktperson = models.CharField(max_length=200, blank=True, default='', help_text='Name der Kontaktperson')
    telefon = models.CharField(max_length=20, blank=True, default='')
    teilnehmerzahl = models.IntegerField(null=True, blank=True, help_text='Anzahl der Teilnehmer')
    
    datum_start = models.DateField()
    datum_ende = models.DateField(null=True, blank=True, help_text='Enddatum falls mehrere Tage')
    startzeit = models.TimeField()
    endzeit = models.TimeField()
    
    kategorie = models.CharField(max_length=20, choices=KATEGORIE_CHOICES, default='termin')
    
    # Wiederholung
    wiederholung = models.CharField(
        max_length=20,
        choices=[('keine', 'Keine'), ('täglich', 'Täglich'), ('wöchentlich', 'Wöchentlich'), ('monatlich', 'Monatlich')],
        default='keine'
    )
    wiederholung_bis = models.DateField(null=True, blank=True, help_text='Wiederholung bis Datum')
    
    beschreibung = models.TextField(blank=True)
    farbe = models.CharField(max_length=7, default='#2563eb', help_text='Hex-Farbcode')
    
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    erstellt_von = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-datum_start', 'raum', 'startzeit']
        verbose_name = "Raumbelegung"
        verbose_name_plural = "Raumbelegungen"

    def __str__(self):
        return f"{self.raum.name} - {self.titel} ({self.datum_start})"

    def ueberschneidung_pruefung(self):
        """Prüft auf zeitliche Überschneidungen mit anderen Buchungen im selben Raum"""
        # Prüfe alle Buchungen im gleichen Raum
        buchungen = Raumbelegung.objects.filter(raum=self.raum).exclude(pk=self.pk)
        
        for buchung in buchungen:
            # Prüfe ob Datumsbereich überschneidet
            if not (self.datum_ende or self.datum_start) < buchung.datum_start or \
               not (buchung.datum_ende or buchung.datum_start) < self.datum_start:
                # Datumsbereich überlappt - prüfe Zeiten
                if not (self.endzeit <= buchung.startzeit or self.startzeit >= buchung.endzeit):
                    return False
        return True

