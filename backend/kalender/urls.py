from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GemeindeterminViewSet, MitarbeitereintraginViewSet, RaumbelegungViewSet, 
    RaumViewSet, KalenderKategorieViewSet, MitarbeiterKategorieViewSet, 
    MitarbeiterViewSet, feiertage_view, gemeindetermine_ics_export, 
    jahreskalender_excel_export
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
    path('', include(router.urls)),
]
