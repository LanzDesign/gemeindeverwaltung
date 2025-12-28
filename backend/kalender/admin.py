from django.contrib import admin
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung


@admin.register(Gemeindetermin)
class GemeindeterminAdmin(admin.ModelAdmin):
    list_display = ['titel', 'datum', 'startzeit', 'endzeit', 'erstellt_von']
    list_filter = ['datum', 'erstellt_am']
    search_fields = ['titel', 'beschreibung']
    ordering = ['-datum']


@admin.register(Mitarbeitereintrag)
class MitarbeitereintraginAdmin(admin.ModelAdmin):
    list_display = ['person', 'typ', 'datum', 'startzeit', 'titel']
    list_filter = ['datum', 'typ', 'person', 'erstellt_am']
    search_fields = ['person', 'titel', 'beschreibung']
    ordering = ['-datum']


@admin.register(Raumbelegung)
class RaumbelegungAdmin(admin.ModelAdmin):
    list_display = ['raum', 'titel', 'datum', 'startzeit', 'endzeit']
    list_filter = ['raum', 'datum', 'erstellt_am']
    search_fields = ['raum', 'titel', 'beschreibung']
    ordering = ['-datum', 'raum']
