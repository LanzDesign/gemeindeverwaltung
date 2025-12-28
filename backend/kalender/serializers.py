from rest_framework import serializers
from .models import Gemeindetermin, Mitarbeitereintrag, Raumbelegung


class GemeindeterminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gemeindetermin
        fields = ['id', 'titel', 'datum', 'startzeit', 'endzeit', 'beschreibung', 'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']


class MitarbeitereintraginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mitarbeitereintrag
        fields = ['id', 'person', 'datum', 'startzeit', 'endzeit', 'typ', 'titel', 'beschreibung', 'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']


class RaumbelegungSerializer(serializers.ModelSerializer):
    class Meta:
        model = Raumbelegung
        fields = ['id', 'raum', 'titel', 'datum', 'startzeit', 'endzeit', 'beschreibung', 'erstellt_am', 'aktualisiert_am']
        read_only_fields = ['erstellt_am', 'aktualisiert_am']
