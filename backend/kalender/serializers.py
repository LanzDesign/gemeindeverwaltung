from rest_framework import serializers
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung, KalenderKategorie, MitarbeiterKategorie, Mitarbeiter


class MitarbeiterSerializer(serializers.ModelSerializer):
    vollstaendiger_name = serializers.ReadOnlyField()
    urlaubstage_verfuegbar = serializers.ReadOnlyField()
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Mitarbeiter
        fields = ['id', 'user', 'username', 'vorname', 'nachname', 'vollstaendiger_name', 
                  'urlaubstage_gesamt', 'urlaubstage_genommen', 'urlaubstage_verfuegbar', 'aktiv']


class KalenderKategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = KalenderKategorie
        fields = ['id', 'name', 'bezeichnung', 'abkuerzung', 'farbe', 'aktiv', 'sortierung']


class MitarbeiterKategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = MitarbeiterKategorie
        fields = ['id', 'name', 'bezeichnung', 'abkuerzung', 'farbe', 'aktiv', 'sortierung']


class GemeindeterminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gemeindetermin
        fields = ['id', 'titel', 'datum', 'startzeit', 'endzeit', 'beschreibung', 'kategorie', 'farbe', 'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']


class MitarbeitereintraginSerializer(serializers.ModelSerializer):
    mitarbeiter_name = serializers.CharField(source='mitarbeiter.vollstaendiger_name', read_only=True)
    kategorie_detail = MitarbeiterKategorieSerializer(source='kategorie', read_only=True)
    dauer_tage = serializers.ReadOnlyField()
    datum = serializers.ReadOnlyField()  # Backward compatibility
    
    class Meta:
        model = Mitarbeitereintrag
        fields = ['id', 'mitarbeiter', 'mitarbeiter_name', 'person', 'datum_start', 'datum_ende', 
                  'startzeit', 'endzeit', 'ganztaegig', 'halbtags', 'typ', 'titel', 'beschreibung', 
                  'kategorie', 'kategorie_detail', 'dauer_tage', 'datum', 'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']


class RaumbelegungSerializer(serializers.ModelSerializer):
    class Meta:
        model = Raumbelegung
        fields = ['id', 'raum', 'titel', 'datum', 'startzeit', 'endzeit', 'beschreibung', 'kategorie', 'farbe', 'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']

