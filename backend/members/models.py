from django.db import models
from django.utils.text import slugify
from django.contrib.auth.models import User
from django.utils import timezone
from PIL import Image
import io
from django.core.files.base import ContentFile
import random
import string

class ServiceTag(models.Model):
    name = models.CharField("Dienst-Name", max_length=50, unique=True)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Dienst (Tag)"
        verbose_name_plural = "Dienste (Tags)"
        ordering = ['name']

class Member(models.Model):
    STATUS_CHOICES = [
        ('active', 'Aktiv'),
        ('passive', 'Passiv'),
        ('minor', 'Minderjährig'),
        ('guest', 'Gast'),
    ]
    
    GENDER_CHOICES = [
        ('male', 'Männlich'),
        ('female', 'Weiblich'),
    ]
    
    # --- Persönliche Daten ---
    last_name = models.CharField("Familienname", max_length=100)
    first_name = models.CharField("Name (Vorname)", max_length=100)
    gender = models.CharField("Geschlecht", max_length=10, choices=GENDER_CHOICES, blank=True, default='')
    email = models.EmailField("E-Mail", blank=True, null=True)
    phone = models.CharField("Telefonnummer", max_length=20, blank=True)
    street = models.CharField("Straße", max_length=200, blank=True)
    postal_code = models.CharField("PLZ", max_length=10, blank=True)
    city = models.CharField("Ort", max_length=100, blank=True)
    date_of_birth = models.DateField("Geburtsdatum", null=True, blank=True)
    married_since = models.DateField("Verheiratet seit", null=True, blank=True)
    marriage_location = models.CharField("Heiratsort", max_length=100, blank=True, null=True, default='')
    profession = models.CharField("Beruf", max_length=200, blank=True)
    nationality = models.CharField("Nationalität", max_length=100, blank=True)

    # --- Gemeindedaten ---
    status = models.CharField("Status", max_length=20, choices=STATUS_CHOICES, default='active')
    is_donor = models.BooleanField("Spender (Ja/Nein)", default=False)
    is_member = models.BooleanField("Mitglied (Ja/Nein)", default=True, help_text="Ist diese Person ein offizielles Gemeindemitglied?")
    is_youth = models.BooleanField("Jugendmitglied (Ja/Nein)", default=False)
    is_child = models.BooleanField("Kind (Ja/Nein)", default=False)
    
    current_services = models.ManyToManyField(ServiceTag, verbose_name="Aktuelle Dienste", blank=True, related_name='members_current')
    desired_services = models.ManyToManyField(ServiceTag, verbose_name="Wunschdienste", blank=True, related_name='members_desired')

    community_suggestions = models.TextField("Anregungen der Gemeinde", blank=True)
    
    photo = models.ImageField("Foto", upload_to='members/photos/', blank=True, null=True)
    photo_thumb = models.ImageField("Foto (Thumbnail 240x240)", upload_to='members/photos/thumbs/', blank=True, null=True)
    signature = models.ImageField("Unterschrift", upload_to='members/signatures/', blank=True, null=True)
    signature_location = models.CharField("Unterschriftsort", max_length=100, blank=True, default="Lahr")
    
    # NEU: Datenschutzerklärung als PDF
    privacy_policy_pdf = models.FileField(
        "Datenschutzerklärung (PDF)", 
        upload_to='members/privacy/', 
        blank=True, 
        null=True,
        help_text="Automatisch generiertes PDF mit Unterschrift"
    )
    
    # Datenschutz-Einwilligungen (für Übersicht welche Felder bestätigt wurden)
    privacy_membership = models.BooleanField("DS: Mitgliedschaft", default=False)
    privacy_whatsapp = models.BooleanField("DS: WhatsApp-Gruppe", default=False)
    privacy_data_protection = models.BooleanField("DS: Datenschutzerklärung gelesen", default=False)
    privacy_data_release = models.BooleanField("DS: Datenweitergabe", default=False)
    privacy_donation = models.BooleanField("DS: Spendenquittung", default=False)
    privacy_children = models.BooleanField("DS: Kinder-Daten", default=False)
    
    # Soft-Delete Felder (DSGVO-konform)
    deleted_at = models.DateTimeField("Gelöscht am", null=True, blank=True, help_text="Zeitpunkt des Löschens (Soft-Delete)")
    deleted_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Gelöscht von",
        related_name='deleted_members',
        help_text="Admin der das Mitglied gelöscht hat"
    )
    anonymized_at = models.DateTimeField("Anonymisiert am", null=True, blank=True, help_text="Zeitpunkt der Anonymisierung nach 30 Tagen")
    archived_at = models.DateTimeField("Archiviert am", null=True, blank=True, help_text="Zeitpunkt der Archivierung (nach 6 Jahren)")
    archival_reason = models.CharField("Archivierungsgrund", max_length=500, blank=True, help_text="Grund für die Archivierung")
    deletion_certificate_url = models.FileField("Löschbestätigung (PDF)", upload_to='members/deletion_certs/', blank=True, null=True, help_text="Bestätigung der Datenlöschung")

    def save(self, *args, **kwargs):
        """
        Überschreibt save(), um Foto zu optimieren und Thumbnail zu erstellen
        """
        # Erst speichern, damit self.pk vorhanden ist
        super().save(*args, **kwargs)

        # Foto nach dem Speichern ggf. auf max. Breite 720px verkleinern
        if self.photo and hasattr(self.photo, 'path'):
            try:
                import os
                if not os.path.exists(self.photo.path):
                    # Datei noch nicht auf Disk - überspringen
                    return
                    
                img = Image.open(self.photo.path)
                img_format = 'JPEG'
                if img.mode in ("RGBA", "P"):  # in RGB konvertieren
                    img = img.convert("RGB")
                width, height = img.size
                max_width = 720
                needs_resize = width > max_width
                
                if needs_resize:
                    scale = max_width / float(width)
                    new_size = (int(width * scale), int(height * scale))
                    img = img.resize(new_size, Image.LANCZOS)
                    buffer = io.BytesIO()
                    img.save(buffer, format=img_format, quality=85)
                    buffer.seek(0)
                    file_name = f"member_{self.pk}_photo.jpg"
                    self.photo.save(file_name, ContentFile(buffer.read()), save=False)
                    super().save(update_fields=['photo'])
                
                # Thumbnail (240x240 center-crop) erzeugen (nur wenn photo_thumb Feld existiert)
                if hasattr(self, 'photo_thumb'):
                    thumb_size = (240, 240)
                    img_thumb = Image.open(self.photo.path)
                    if img_thumb.mode in ("RGBA", "P"):
                        img_thumb = img_thumb.convert("RGB")
                    tw, th = img_thumb.size
                    # center crop to square
                    min_edge = min(tw, th)
                    left = (tw - min_edge) // 2
                    top = (th - min_edge) // 2
                    right = left + min_edge
                    bottom = top + min_edge
                    img_thumb = img_thumb.crop((left, top, right, bottom))
                    img_thumb = img_thumb.resize(thumb_size, Image.LANCZOS)
                    tbuf = io.BytesIO()
                    img_thumb.save(tbuf, format='JPEG', quality=85)
                    tbuf.seek(0)
                    thumb_name = f"member_{self.pk}_thumb.jpg"
                    self.photo_thumb.save(thumb_name, ContentFile(tbuf.read()), save=False)
                    super().save(update_fields=['photo_thumb'])
            except Exception as e:
                # Bei Fehlern Foto unverändert lassen, aber nicht abstürzen
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Fehler bei Foto-Verarbeitung für Member {self.pk}: {e}")
                pass
    
    def soft_delete(self, user=None):
        """Soft-Delete: Setzt deleted_at statt echtes Löschen"""
        self.deleted_at = timezone.now()
        if user:
            self.deleted_by = user
        self.save(update_fields=['deleted_at', 'deleted_by'])
    
    def restore(self):
        """Wiederherstellen aus Papierkorb"""
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['deleted_at', 'deleted_by'])
    
    def anonymize(self):
        """Anonymisierung nach 30 Tagen - nur personenbezogene Daten, PDF bleibt"""
        self.first_name = f"Gelöscht"
        self.last_name = f"Mitglied #{self.pk}"
        self.email = None
        self.phone = ""
        self.street = ""
        self.postal_code = ""
        self.city = ""
        self.date_of_birth = None
        self.married_since = None
        self.profession = ""
        self.nationality = ""
        # Foto löschen, aber Unterschrift und PDF behalten (Nachweispflicht)
        if self.photo:
            self.photo.delete(save=False)
        if self.photo_thumb:
            self.photo_thumb.delete(save=False)
        self.anonymized_at = timezone.now()
        self.save()
    
    def __str__(self):
        return f"{self.last_name}, {self.first_name}"

    class Meta:
        verbose_name = "Mitglied"
        verbose_name_plural = "Mitglieder"
        ordering = ['last_name', 'first_name']

class Familie(models.Model):
    name = models.CharField("Familienname", max_length=100, help_text="z.B. Max Müller")
    family_code = models.CharField("Familien-Code", max_length=20, unique=True, null=True, blank=True, help_text="Eindeutiger Code zum Beitreten der Familie")
    
    # Vater und Mutter sind Members (können leer sein)
    vater = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='familien_als_vater', 
        verbose_name="Vater"
    )
    mutter = models.ForeignKey(
        Member, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='familien_als_mutter', 
        verbose_name="Mutter"
    )
    
    # Kinder sind auch Members (ManyToMany)
    kinder = models.ManyToManyField(
        Member, 
        blank=True, 
        related_name='familien_als_kind', 
        verbose_name="Kinder"
    )

    def save(self, *args, **kwargs):
        # Automatisch einen Code generieren, wenn keiner vorhanden ist
        if not self.family_code:
            self.family_code = self.generate_family_code()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_family_code():
        """Generiert einen eindeutigen Familien-Code"""
        while True:
            # Format: NACHNAME-XXXX (z.B. MÜLLER-A7K9)
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            if not Familie.objects.filter(family_code__endswith=code).exists():
                return code
        
    def __str__(self):
        return f"{self.name} ({self.family_code})"

    class Meta:
        verbose_name = "Familie"
        verbose_name_plural = "Familien"

class Gruppe(models.Model):
    GROUP_SIZE_CHOICES = [
        ('large', 'Große Gruppe (ca. 100 Mitglieder)'),
        ('small', 'Kleine Gruppe (ca. 30 Mitglieder)'),
    ]
    
    name = models.CharField("Gruppenname", max_length=100, unique=True)
    size_type = models.CharField("Gruppengröße", max_length=10, choices=GROUP_SIZE_CHOICES, default='small')
    description = models.TextField("Beschreibung", blank=True)
    
    # Parent-Gruppe (nur für kleine Gruppen)
    parent_gruppe = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='untergruppen',
        verbose_name="Übergeordnete Gruppe",
        help_text="Für kleine Gruppen: Zugehörigkeit zu einer großen Gruppe (z.B. Gruppe 1-1 gehört zu Gruppe 1)",
        limit_choices_to={'size_type': 'large'}
    )
    
    # Ansprechpartner (mehrere möglich)
    ansprechpartner = models.ManyToManyField(
        Member,
        blank=True,
        related_name='gruppen_als_ansprechpartner',
        verbose_name="Ansprechpartner",
        help_text="Zuständige Ansprechpartner für diese Gruppe (mehrere möglich)"
    )
    
    # Mitglieder der Gruppe
    members = models.ManyToManyField(
        Member,
        blank=True,
        related_name='gruppen',
        verbose_name="Mitglieder"
    )
    
    created_at = models.DateTimeField("Erstellt am", auto_now_add=True)
    updated_at = models.DateTimeField("Aktualisiert am", auto_now=True)
    
    @staticmethod
    def get_next_group_number(size_type, parent_gruppe=None):
        """
        Findet die nächste verfügbare Gruppennummer.
        Wiederverwendet gelöschte Nummern (Lücken in der Sequenz).
        """
        import re
        
        if size_type == 'large':
            # Große Gruppen: "Gruppe 1", "Gruppe 2", etc.
            existing_groups = Gruppe.objects.filter(size_type='large')
            pattern = r'^Gruppe (\d+)$'
        else:
            # Kleine Gruppen: "Gruppe 1-1", "Gruppe 2-1", etc.
            if not parent_gruppe:
                return None
            parent_match = re.match(r'^Gruppe (\d+)$', parent_gruppe.name)
            if not parent_match:
                return None
            parent_number = parent_match.group(1)
            existing_groups = Gruppe.objects.filter(size_type='small', parent_gruppe=parent_gruppe)
            pattern = rf'^Gruppe {parent_number}-(\d+)$'
        
        # Extrahiere alle existierenden Nummern
        used_numbers = set()
        for gruppe in existing_groups:
            match = re.match(pattern, gruppe.name)
            if match:
                used_numbers.add(int(match.group(1)))
        
        # Finde die kleinste fehlende Nummer (Lücke füllen)
        next_number = 1
        while next_number in used_numbers:
            next_number += 1
        
        # Generiere den Namen
        if size_type == 'large':
            return f"Gruppe {next_number}"
        else:
            parent_number = re.match(r'^Gruppe (\d+)$', parent_gruppe.name).group(1)
            return f"Gruppe {parent_number}-{next_number}"
    
    def save(self, *args, **kwargs):
        """
        Automatische Benennung beim Erstellen neuer Gruppen
        """
        if not self.pk and not self.name:  # Nur bei neuen Gruppen ohne Namen
            auto_name = self.get_next_group_number(self.size_type, self.parent_gruppe)
            if auto_name:
                self.name = auto_name
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.name} ({self.get_size_type_display()})"
    
    def member_count(self):
        return self.members.count()
    member_count.short_description = "Anzahl Mitglieder"
    
    class Meta:
        verbose_name = "Gruppe"
        verbose_name_plural = "Gruppen"
        ordering = ['name']

class Feedback(models.Model):
    FEEDBACK_TYPES = [
        ('community', 'Wünsche von der Gemeinde'),
        ('groups', 'Wünsche von den Gruppen'),
        ('servants', 'Anregungen an die Diener'),
        ('elders', 'Anregungen an die Ältesten'),
        ('pastor', 'Anregungen an den Pastor'),
    ]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='feedbacks', verbose_name="Mitglied")
    category = models.CharField("Kategorie", max_length=50, choices=FEEDBACK_TYPES)
    text = models.TextField("Inhalt")
    created_at = models.DateTimeField("Erstellt am", auto_now_add=True)

    def __str__(self):
        return f"{self.get_category_display()} von {self.member}"

    class Meta:
        verbose_name = "Feedback / Anregung"
        verbose_name_plural = "Feedbacks / Anregungen"
        ordering = ['-created_at']