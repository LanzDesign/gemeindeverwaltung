from rest_framework import serializers
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung, Raum, KalenderKategorie, MitarbeiterKategorie, Mitarbeiter


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
    raum_namen = serializers.SerializerMethodField()
    ueberschneidung_ok = serializers.SerializerMethodField()
    farbe_kategorie = serializers.SerializerMethodField()
    
    class Meta:
        model = Raumbelegung
        fields = ['id', 'raum', 'raum_namen', 'titel', 'kontaktperson', 'telefon', 'teilnehmerzahl',
                  'datum_start', 'datum_ende', 'startzeit', 'endzeit', 'kategorie', 'wiederholung', 
                  'wiederholung_bis', 'beschreibung', 'farbe', 'farbe_kategorie', 'ueberschneidung_ok', 
                  'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']
    
    def get_raum_namen(self, obj):
        """Gibt die Namen aller gebuchten Räume zurück"""
        return [raum.name for raum in obj.raum.all()]
    
    def get_ueberschneidung_ok(self, obj):
        """Prüft auf Überschneidungen"""
        result = obj.ueberschneidung_pruefung()
        return result
    
    def get_farbe_kategorie(self, obj):
        """Gibt die Farbe basierend auf Kategorie/Wiederholung zurück"""
        if obj.wiederholung != 'keine':
            return '#eab308'  # Gelb für wiederholende Termine (W)
        return obj.get_farbe_by_kategorie()
    
    def validate(self, data):
        """Validiere Pflichtfelder und logische Konsistenz"""
        # Pflichtfelder prüfen
        if not data.get('kontaktperson'):
            raise serializers.ValidationError({
                'kontaktperson': 'Name der Kontaktperson ist ein Pflichtfeld'
            })
        
        if not data.get('telefon'):
            raise serializers.ValidationError({
                'telefon': 'Telefonnummer ist ein Pflichtfeld'
            })
        
        # Zeitlogik prüfen
        if data.get('startzeit') and data.get('endzeit'):
            if data['startzeit'] >= data['endzeit']:
                raise serializers.ValidationError({
                    'endzeit': 'Endzeit muss nach der Startzeit liegen'
                })
        
        # Datumslogik prüfen
        if data.get('datum_ende') and data.get('datum_start'):
            if data['datum_ende'] < data['datum_start']:
                raise serializers.ValidationError({
                    'datum_ende': 'Enddatum muss nach dem Startdatum liegen'
                })
        
        return data


class RaumSerializer(serializers.ModelSerializer):
    belegungen_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Raum
        fields = ['id', 'name', 'beschreibung', 'kapazitaet', 'aktiv', 'belegungen_count', 'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']
    
    def get_belegungen_count(self, obj):
        return obj.belegungen.count()

