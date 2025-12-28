from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GemeindeterminViewSet, MitarbeitereintraginViewSet, RaumbelegungViewSet

router = DefaultRouter()
router.register(r'gemeindetermine', GemeindeterminViewSet, basename='gemeindetermin')
router.register(r'mitarbeitertermine', MitarbeitereintraginViewSet, basename='mitarbeitereintrag')
router.register(r'raumbelegungen', RaumbelegungViewSet, basename='raumbelegung')

urlpatterns = [
    path('', include(router.urls)),
]
