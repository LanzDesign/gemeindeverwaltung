from rest_framework import viewsets, permissions, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung, Raum, KalenderKategorie, MitarbeiterKategorie, Mitarbeiter
from .serializers import GemeindeterminSerializer, MitarbeitereintraginSerializer, RaumbelegungSerializer, RaumSerializer, KalenderKategorieSerializer, MitarbeiterKategorieSerializer, MitarbeiterSerializer
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
    
    def get_permissions(self):
        """Lesen öffentlich, Schreiben nur authentifiziert"""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

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
    """ViewSet für Raumbelegungen mit Überschneidungsprüfung"""
    queryset = Raumbelegung.objects.all()
    serializer_class = RaumbelegungSerializer
    
    def get_permissions(self):
        """Lesen öffentlich, Schreiben nur authentifiziert"""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        """Erstelle neue Raumbelegung mit Überschneidungsprüfung"""
        # Setze erstellt_von nur wenn User authentifiziert ist
        if self.request.user.is_authenticated:
            raumbelegung = serializer.save(erstellt_von=self.request.user)
        else:
            raumbelegung = serializer.save()
        
        # Prüfe auf Überschneidungen nach dem Speichern
        # (da wir die ManyToMany Räume brauchen)
        raum_ids = self.request.data.get('raum', [])
        if raum_ids:
            ergebnis = raumbelegung.ueberschneidung_pruefung(raum_ids)
            if not ergebnis['ok']:
                # Lösche die Buchung wieder und gebe Fehler zurück
                raumbelegung.delete()
                raise serializers.ValidationError({
                    'ueberschneidung': 'Es gibt zeitliche Überschneidungen',
                    'konflikte': ergebnis['konflikte']
                })
    
    def perform_update(self, serializer):
        """Update Raumbelegung mit Überschneidungsprüfung"""
        raumbelegung = serializer.save()
        
        # Prüfe auf Überschneidungen
        raum_ids = self.request.data.get('raum', [])
        if raum_ids:
            ergebnis = raumbelegung.ueberschneidung_pruefung(raum_ids)
            if not ergebnis['ok']:
                raise serializers.ValidationError({
                    'ueberschneidung': 'Es gibt zeitliche Überschneidungen',
                    'konflikte': ergebnis['konflikte']
                })


class RaumViewSet(viewsets.ModelViewSet):
    """ViewSet für Räume"""
    queryset = Raum.objects.all()
    serializer_class = RaumSerializer
    
    def get_permissions(self):
        """Lesen öffentlich, Schreiben nur authentifiziert"""
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
