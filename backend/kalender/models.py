from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


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
    ]
    
    KATEGORIE_CHOICES = [
        ('intern', 'Intern'),
        ('extern', 'Extern'),
        ('allgemein', 'Allgemein'),
    ]

    person = models.CharField(max_length=200)
    datum = models.DateField()
    startzeit = models.TimeField()
    endzeit = models.TimeField()
    typ = models.CharField(max_length=20, choices=TYP_CHOICES, default='termin')
    titel = models.CharField(max_length=200)
    beschreibung = models.TextField(blank=True)
    kategorie = models.CharField(max_length=20, choices=KATEGORIE_CHOICES, default='allgemein')
    farbe = models.CharField(max_length=7, default='#ea580c', help_text='Hex-Farbcode (z.B. #ea580c)')
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)
    erstellt_von = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-datum', 'startzeit']
        verbose_name = "Mitarbeitereintrag"
        verbose_name_plural = "Mitarbeitereintr??ge"

    def __str__(self):
        return f"{self.person} - {self.typ} ({self.datum})"


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

