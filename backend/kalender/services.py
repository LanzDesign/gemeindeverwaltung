"""
Service für Feiertage von api-feiertage.de
"""
import requests
from datetime import datetime, date
from typing import List, Dict, Optional
from django.core.cache import cache


class FeiertagService:
    """Service zum Abrufen von Feiertagen für Baden-Württemberg"""
    
    API_URL = "https://www.api-feiertage.de"
    BUNDESLAND = "BW"
    CACHE_TIMEOUT = 86400  # 24 Stunden
    
    @classmethod
    def get_feiertage(cls, jahr: int) -> List[Dict]:
        """
        Holt Feiertage für ein bestimmtes Jahr
        
        Returns:
            Liste von Feiertagen mit Struktur:
            [
                {
                    'datum': '2025-01-01',
                    'name': 'Neujahr',
                    'hinweis': 'Gesetzlicher Feiertag'
                },
                ...
            ]
        """
        cache_key = f'feiertage_{jahr}_{cls.BUNDESLAND}'
        
        # Versuche aus Cache zu laden
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
        
        try:
            # API-Aufruf
            url = f"{cls.API_URL}?jahre={jahr}&nur_land={cls.BUNDESLAND}"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Feiertage extrahieren und formatieren
            feiertage = []
            feiertage_raw = data.get('feiertage', [])
            
            for feiertag in feiertage_raw:
                name = feiertag.get('fname', '')
                datum_str = feiertag.get('date', '')
                hinweis = feiertag.get('hinweis', '')
                
                if name and datum_str:
                    feiertage.append({
                        'datum': datum_str,
                        'name': name,
                        'hinweis': hinweis or 'Gesetzlicher Feiertag'
                    })
            
            # Im Cache speichern
            cache.set(cache_key, feiertage, cls.CACHE_TIMEOUT)
            
            return feiertage
            
        except Exception as e:
            print(f"Fehler beim Laden der Feiertage: {e}")
            return []
    
    @classmethod
    def get_feiertage_for_month(cls, jahr: int, monat: int) -> List[Dict]:
        """Holt Feiertage für einen bestimmten Monat"""
        alle_feiertage = cls.get_feiertage(jahr)
        
        return [
            ft for ft in alle_feiertage
            if ft['datum'].startswith(f"{jahr}-{monat:02d}")
        ]
    
    @classmethod
    def get_feiertag_for_date(cls, datum: date) -> Optional[Dict]:
        """Prüft ob ein Datum ein Feiertag ist"""
        alle_feiertage = cls.get_feiertage(datum.year)
        datum_str = datum.strftime('%Y-%m-%d')
        
        for feiertag in alle_feiertage:
            if feiertag['datum'] == datum_str:
                return feiertag
        
        return None
    
    @classmethod
    def ist_feiertag(cls, datum: date) -> bool:
        """Prüft ob ein Datum ein Feiertag ist"""
        return cls.get_feiertag_for_date(datum) is not None
