from rest_framework import viewsets, permissions
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung, KalenderKategorie
from .serializers import GemeindeterminSerializer, MitarbeitereintraginSerializer, RaumbelegungSerializer, KalenderKategorieSerializer


class KalenderKategorieViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet für Kalender-Kategorien (nur lesen)"""
    queryset = KalenderKategorie.objects.filter(aktiv=True)
    serializer_class = KalenderKategorieSerializer
    permission_classes = [permissions.AllowAny]


class GemeindeterminViewSet(viewsets.ModelViewSet):
    """ViewSet für Gemeindetermine"""
    queryset = Gemeindetermin.objects.all()
    serializer_class = GemeindeterminSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(erstellt_von=self.request.user)


class MitarbeitereintraginViewSet(viewsets.ModelViewSet):
    """ViewSet für Mitarbeitereinträge"""
    queryset = Mitarbeitereintrag.objects.all()
    serializer_class = MitarbeitereintraginSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(erstellt_von=self.request.user)


class RaumbelegungViewSet(viewsets.ModelViewSet):
    """ViewSet für Raumbelegungen"""
    queryset = Raumbelegung.objects.all()
    serializer_class = RaumbelegungSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(erstellt_von=self.request.user)
