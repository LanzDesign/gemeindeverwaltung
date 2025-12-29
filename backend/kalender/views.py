from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung, KalenderKategorie, MitarbeiterKategorie, Mitarbeiter
from .serializers import GemeindeterminSerializer, MitarbeitereintraginSerializer, RaumbelegungSerializer, KalenderKategorieSerializer, MitarbeiterKategorieSerializer, MitarbeiterSerializer
from .services import FeiertagService


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def feiertage_view(request):
    """API-Endpoint für Feiertage"""
    jahr = request.GET.get('jahr')
    monat = request.GET.get('monat')
    
    if not jahr:
        from datetime import date
        jahr = date.today().year
    else:
        jahr = int(jahr)
    
    if monat:
        monat = int(monat)
        feiertage = FeiertagService.get_feiertage_for_month(jahr, monat)
    else:
        feiertage = FeiertagService.get_feiertage(jahr)
    
    return Response({
        'jahr': jahr,
        'monat': monat,
        'feiertage': feiertage
    })


class MitarbeiterViewSet(viewsets.ModelViewSet):
    """ViewSet für Mitarbeiter"""
    queryset = Mitarbeiter.objects.filter(aktiv=True)
    serializer_class = MitarbeiterSerializer
    permission_classes = [permissions.IsAuthenticated]


class KalenderKategorieViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet für Kalender-Kategorien (nur lesen)"""
    queryset = KalenderKategorie.objects.filter(aktiv=True)
    serializer_class = KalenderKategorieSerializer
    permission_classes = [permissions.AllowAny]


class MitarbeiterKategorieViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet für Mitarbeiter-Kategorien (nur lesen)"""
    queryset = MitarbeiterKategorie.objects.filter(aktiv=True)
    serializer_class = MitarbeiterKategorieSerializer
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
