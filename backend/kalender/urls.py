from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GemeindeterminViewSet, MitarbeitereintraginViewSet, RaumbelegungViewSet, KalenderKategorieViewSet, MitarbeiterKategorieViewSet, MitarbeiterViewSet, feiertage_view

router = DefaultRouter()
router.register(r'mitarbeiter', MitarbeiterViewSet, basename='mitarbeiter')
router.register(r'kategorien', KalenderKategorieViewSet, basename='kalenderkategorie')
router.register(r'mitarbeiterkategorien', MitarbeiterKategorieViewSet, basename='mitarbeiterkategorie')
router.register(r'gemeindetermine', GemeindeterminViewSet, basename='gemeindetermin')
router.register(r'mitarbeitertermine', MitarbeitereintraginViewSet, basename='mitarbeitereintrag')
router.register(r'raumbelegungen', RaumbelegungViewSet, basename='raumbelegung')

urlpatterns = [
    path('feiertage/', feiertage_view, name='feiertage'),
    path('', include(router.urls)),
]
