from django.contrib import admin
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung, Raum, KalenderKategorie, MitarbeiterKategorie, Mitarbeiter


@admin.register(Mitarbeiter)
class MitarbeiterAdmin(admin.ModelAdmin):
    list_display = ['vollstaendiger_name', 'user', 'urlaubstage_gesamt', 'urlaubstage_genommen', 'urlaubstage_verfuegbar', 'aktiv']
    list_filter = ['aktiv', 'erstellt_am']
    search_fields = ['vorname', 'nachname', 'user__username']
    ordering = ['nachname', 'vorname']
    fields = ['user', 'vorname', 'nachname', 'urlaubstage_gesamt', 'urlaubstage_genommen', 'aktiv']
    
    def urlaubstage_verfuegbar(self, obj):
        return obj.urlaubstage_verfuegbar
    urlaubstage_verfuegbar.short_description = 'Verfügbar'


@admin.register(KalenderKategorie)
class KalenderKategorieAdmin(admin.ModelAdmin):
    list_display = ['bezeichnung', 'name', 'abkuerzung', 'farbe_anzeigen', 'aktiv', 'sortierung']
    list_filter = ['aktiv']
    search_fields = ['name', 'bezeichnung']
    ordering = ['sortierung', 'name']
    fields = ['name', 'bezeichnung', 'abkuerzung', 'farbe', 'aktiv', 'sortierung']
    
    def farbe_anzeigen(self, obj):
        abk = f" [{obj.abkuerzung}]" if obj.abkuerzung else ""
        return f'<span style="background-color:{obj.farbe}; padding:5px 15px; border-radius:5px; color:white; font-weight:bold;">{obj.farbe}{abk}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True


@admin.register(MitarbeiterKategorie)
class MitarbeiterKategorieAdmin(admin.ModelAdmin):
    list_display = ['bezeichnung', 'name', 'abkuerzung', 'farbe_anzeigen', 'aktiv', 'sortierung']
    list_filter = ['aktiv']
    search_fields = ['name', 'bezeichnung']
    ordering = ['sortierung', 'name']
    fields = ['name', 'bezeichnung', 'abkuerzung', 'farbe', 'aktiv', 'sortierung']
    
    def farbe_anzeigen(self, obj):
        abk = f" [{obj.abkuerzung}]" if obj.abkuerzung else ""
        return f'<span style="background-color:{obj.farbe}; padding:5px 15px; border-radius:5px; color:white; font-weight:bold;">{obj.farbe}{abk}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True


@admin.register(Gemeindetermin)
class GemeindeterminAdmin(admin.ModelAdmin):
    list_display = ['titel', 'datum', 'startzeit', 'endzeit', 'kategorie_anzeigen', 'farbe_anzeigen', 'erstellt_von']
    list_filter = ['datum', 'kategorie_neu', 'kategorie', 'erstellt_am']
    search_fields = ['titel', 'beschreibung']
    ordering = ['-datum']
    fields = ['titel', 'datum', 'startzeit', 'endzeit', 'kategorie_neu', 'kategorie', 'farbe', 'beschreibung', 'erstellt_von']
    
    def kategorie_anzeigen(self, obj):
        if obj.kategorie_neu:
            abk = f" [{obj.kategorie_neu.abkuerzung}]" if obj.kategorie_neu.abkuerzung else ""
            return f'<span style="background-color:{obj.kategorie_neu.farbe}; padding:3px 10px; border-radius:3px; color:white;">{obj.kategorie_neu.bezeichnung}{abk}</span>'
        return obj.get_kategorie_display() if obj.kategorie else '-'
    kategorie_anzeigen.short_description = 'Kategorie'
    kategorie_anzeigen.allow_tags = True
    
    def farbe_anzeigen(self, obj):
        # Farbe aus kategorie_neu oder fallback auf farbe-Feld
        farbe = obj.kategorie_neu.farbe if obj.kategorie_neu else obj.farbe
        return f'<span style="background-color:{farbe}; padding:3px 10px; border-radius:3px; color:white;">{farbe}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True


@admin.register(Mitarbeitereintrag)
class MitarbeitereintraginAdmin(admin.ModelAdmin):
    list_display = ['mitarbeiter_oder_person', 'typ', 'datum_start', 'datum_ende', 'startzeit', 'titel', 'kategorie_anzeigen', 'dauer_tage']
    list_filter = ['datum_start', 'typ', 'mitarbeiter', 'erstellt_am']
    search_fields = ['person', 'titel', 'beschreibung', 'mitarbeiter__vorname', 'mitarbeiter__nachname']
    ordering = ['-datum_start']
    fields = ['mitarbeiter', 'person', 'datum_start', 'datum_ende', 'ganztaegig', 'halbtags', 'startzeit', 'endzeit', 'typ', 'titel', 'kategorie', 'beschreibung', 'erstellt_von']
    
    def mitarbeiter_oder_person(self, obj):
        return str(obj.mitarbeiter) if obj.mitarbeiter else obj.person
    mitarbeiter_oder_person.short_description = 'Mitarbeiter'
    
    def kategorie_anzeigen(self, obj):
        if obj.kategorie:
            abk = f" [{obj.kategorie.abkuerzung}]" if obj.kategorie.abkuerzung else ""
            return f'<span style="background-color:{obj.kategorie.farbe}; padding:3px 10px; border-radius:3px; color:white;">{obj.kategorie.bezeichnung}{abk}</span>'
        return '-'
    kategorie_anzeigen.short_description = 'Kategorie'
    kategorie_anzeigen.allow_tags = True


@admin.register(Raum)
class RaumAdmin(admin.ModelAdmin):
    list_display = ['name', 'kapazitaet', 'aktiv', 'belegungen_count']
    list_filter = ['aktiv']
    search_fields = ['name', 'beschreibung']
    ordering = ['name']
    fields = ['name', 'beschreibung', 'kapazitaet', 'aktiv']
    
    def belegungen_count(self, obj):
        return obj.belegungen.count()
    belegungen_count.short_description = 'Buchungen'


@admin.register(Raumbelegung)
class RaumbelegungAdmin(admin.ModelAdmin):
    list_display = ['raeume_anzeigen', 'titel', 'kontaktperson', 'datum_start', 'startzeit', 'endzeit', 'kategorie_anzeigen', 'farbe_anzeigen']
    list_filter = ['datum_start', 'kategorie_neu', 'kategorie', 'wiederholung', 'erstellt_am']
    search_fields = ['raum__name', 'titel', 'kontaktperson', 'telefon', 'beschreibung']
    ordering = ['-datum_start', 'startzeit']
    fields = ['raum', 'titel', 'kontaktperson', 'telefon', 'teilnehmerzahl', 
              'datum_start', 'datum_ende', 'startzeit', 'endzeit', 
              'kategorie_neu', 'kategorie', 'wiederholung', 'wiederholung_bis', 'farbe', 'beschreibung', 'erstellt_von']
    readonly_fields = ['erstellt_von']
    filter_horizontal = ['raum']
    
    def raeume_anzeigen(self, obj):
        return ', '.join([r.name for r in obj.raum.all()])
    raeume_anzeigen.short_description = 'Räume'
    
    def kategorie_anzeigen(self, obj):
        if obj.kategorie_neu:
            abk = f" [{obj.kategorie_neu.abkuerzung}]" if obj.kategorie_neu.abkuerzung else ""
            return f'<span style="background-color:{obj.kategorie_neu.farbe}; padding:3px 10px; border-radius:3px; color:white;">{obj.kategorie_neu.bezeichnung}{abk}</span>'
        return obj.get_kategorie_display() if obj.kategorie else '-'
    kategorie_anzeigen.short_description = 'Kategorie'
    kategorie_anzeigen.allow_tags = True
    
    def farbe_anzeigen(self, obj):
        # Farbe aus kategorie_neu oder fallback auf farbe-Feld
        farbe = obj.kategorie_neu.farbe if obj.kategorie_neu else obj.farbe
        return f'<span style="background-color:{farbe}; padding:3px 10px; border-radius:3px; color:white;">{farbe}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True
    
    def raeume_anzeigen(self, obj):
        return ", ".join([r.name for r in obj.raum.all()])
    raeume_anzeigen.short_description = 'Räume'
    
    def farbe_anzeigen(self, obj):
        return f'<span style="background-color:{obj.farbe}; padding:3px 10px; border-radius:3px; color:white;">{obj.farbe}</span>'
    farbe_anzeigen.short_description = 'Farbe'
    farbe_anzeigen.allow_tags = True

