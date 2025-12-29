from django.contrib import admin
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung


@admin.register(Gemeindetermin)
class GemeindeterminAdmin(admin.ModelAdmin):
    list_display = ['titel', 'datum', 'startzeit', 'endzeit', 'kategorie', 'farbe_anzeigen', 'erstellt_von']
    list_filter = ['datum', 'kategorie', 'erstellt_am']
    search_fields = ['titel', 'beschreibung']
    ordering = ['-datum']
    fields = ['titel', 'datum', 'startzeit', 'endzeit', 'kategorie', 'farbe', 'beschreibung', 'erstellt_von']
    
    def farbe_anzeigen(self, obj):
        return f'<span style="background-color:{obj.farbe}; padding:3px 10px; border-radius:3px; color:white;">{obj.farbe}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True


@admin.register(Mitarbeitereintrag)
class MitarbeitereintraginAdmin(admin.ModelAdmin):
    list_display = ['person', 'typ', 'datum', 'startzeit', 'titel', 'kategorie', 'farbe_anzeigen']
    list_filter = ['datum', 'typ', 'kategorie', 'person', 'erstellt_am']
    search_fields = ['person', 'titel', 'beschreibung']
    ordering = ['-datum']
    fields = ['person', 'datum', 'startzeit', 'endzeit', 'typ', 'titel', 'kategorie', 'farbe', 'beschreibung', 'erstellt_von']
    
    def farbe_anzeigen(self, obj):
        return f'<span style="background-color:{obj.farbe}; padding:3px 10px; border-radius:3px; color:white;">{obj.farbe}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True


@admin.register(Raumbelegung)
class RaumbelegungAdmin(admin.ModelAdmin):
    list_display = ['raum', 'titel', 'datum', 'startzeit', 'endzeit', 'kategorie', 'farbe_anzeigen']
    list_filter = ['raum', 'datum', 'kategorie', 'erstellt_am']
    search_fields = ['raum', 'titel', 'beschreibung']
    ordering = ['-datum', 'raum']
    fields = ['raum', 'titel', 'datum', 'startzeit', 'endzeit', 'kategorie', 'farbe', 'beschreibung', 'erstellt_von']
    
    def farbe_anzeigen(self, obj):
        return f'<span style="background-color:{obj.farbe}; padding:3px 10px; border-radius:3px; color:white;">{obj.farbe}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True

