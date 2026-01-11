from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GemeindeterminViewSet, MitarbeitereintraginViewSet, RaumbelegungViewSet, 
    RaumViewSet, KalenderKategorieViewSet, MitarbeiterKategorieViewSet, 
    MitarbeiterViewSet, feiertage_view, gemeindetermine_ics_export, 
    jahreskalender_excel_export, mitarbeiter_ics_export, mitarbeiter_excel_export,
    raumbelegungen_ics_export, raumbelegungen_excel_export
)

router = DefaultRouter()
router.register(r'mitarbeiter', MitarbeiterViewSet, basename='mitarbeiter')
router.register(r'kategorien', KalenderKategorieViewSet, basename='kalenderkategorie')
router.register(r'mitarbeiterkategorien', MitarbeiterKategorieViewSet, basename='mitarbeiterkategorie')
router.register(r'gemeindetermine', GemeindeterminViewSet, basename='gemeindetermin')
router.register(r'mitarbeitertermine', MitarbeitereintraginViewSet, basename='mitarbeitereintrag')
router.register(r'raumbelegungen', RaumbelegungViewSet, basename='raumbelegung')
router.register(r'raeume', RaumViewSet, basename='raum')

urlpatterns = [
    path('feiertage/', feiertage_view, name='feiertage'),
    path('gemeindetermine/export/ics/', gemeindetermine_ics_export, name='gemeindetermine-ics-export'),
    path('kalender/export/excel/', jahreskalender_excel_export, name='jahreskalender-excel-export'),
    path('mitarbeiter/export/ics/', mitarbeiter_ics_export, name='mitarbeiter-ics-export'),
    path('mitarbeiter/export/excel/', mitarbeiter_excel_export, name='mitarbeiter-excel-export'),
    path('raeume/export/ics/', raumbelegungen_ics_export, name='raeume-ics-export'),
    path('raeume/export/excel/', raumbelegungen_excel_export, name='raeume-excel-export'),
    path('', include(router.urls)),
]
