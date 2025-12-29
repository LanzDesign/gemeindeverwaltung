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
    titel = models.CharField(max_length=200)
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
        """Berechnet die Anzahl der Tage"""
        if self.datum_ende and self.datum_ende != self.datum_start:
            tage = (self.datum_ende - self.datum_start).days + 1
            if self.halbtags:
                return tage * 0.5
            return tage
        return 0.5 if self.halbtags else 1

    def save(self, *args, **kwargs):
        """Berechne Urlaubstage automatisch"""
        # Prüfe, ob es ein Urlaub-Eintrag ist
        is_new = self.pk is None
        old_tage = 0
        
        if not is_new:
            # Hole alte Version für Vergleich
            try:
                old = Mitarbeitereintrag.objects.get(pk=self.pk)
                # Berechne alte Tage BEVOR wir speichern
                if old.typ == 'urlaub' and old.mitarbeiter:
                    old_tage = old.dauer_tage
                    # Ziehe alte Urlaubstage ab
                    old.mitarbeiter.urlaubstage_genommen -= old_tage
                    old.mitarbeiter.save()
            except Mitarbeitereintrag.DoesNotExist:
                pass
        
        super().save(*args, **kwargs)
        
        # Füge neue Urlaubstage hinzu (nach dem save, damit dauer_tage korrekt berechnet wird)
        if self.typ == 'urlaub' and self.mitarbeiter:
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


class Raumbelegung(models.Model):
    """Raumbelegungsplan"""
    KATEGORIE_CHOICES = [
        ('intern', 'Intern'),
        ('extern', 'Extern'),
        ('allgemein', 'Allgemein'),
    ]
    
    raum = models.CharField(max_length=100)
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
        ordering = ['-datum', 'raum', 'startzeit']
        verbose_name = "Raumbelegung"
        verbose_name_plural = "Raumbelegungen"

    def __str__(self):
        return f"{self.raum} - {self.titel} ({self.datum})"

