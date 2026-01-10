"""
Service für Feiertage von api-feiertage.de
"""
import requests
from datetime import datetime, date, timedelta
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
            print(f"[FeiertagService] Cache HIT für {jahr}: {len(cached_data)} Feiertage")
            return cached_data
        
        try:
            # API-Aufruf
            url = f"{cls.API_URL}?jahre={jahr}&nur_land={cls.BUNDESLAND}"
            print(f"[FeiertagService] API-Aufruf: {url}")
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Feiertage extrahieren und formatieren
            feiertage = []
            feiertage_raw = data.get('feiertage', [])
            print(f"[FeiertagService] API lieferte {len(feiertage_raw)} Feiertage")
            
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
            print(f"[FeiertagService] {len(feiertage)} Feiertage im Cache gespeichert")
            
            return feiertage
            
        except Exception as e:
            print(f"[FeiertagService] FEHLER beim Laden der Feiertage: {e}")
            # Fallback: Fest codierte Feiertage für Baden-Württemberg
            return cls._get_fallback_feiertage(jahr)
    
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
        result = cls.get_feiertag_for_date(datum) is not None
        if result:
            print(f"[FeiertagService] {datum} ist ein Feiertag")
        return result
    
    @classmethod
    def _get_fallback_feiertage(cls, jahr: int) -> List[Dict]:
        """
        Fallback: Fest codierte Feiertage für Baden-Württemberg
        Wird verwendet wenn API nicht erreichbar ist
        """
        from datetime import date
        from dateutil.easter import easter
        
        print(f"[FeiertagService] FALLBACK: Verwende fest codierte Feiertage für {jahr}")
        
        # Berechne Ostern und davon abhängige Feiertage
        ostern = easter(jahr)
        karfreitag = ostern - timedelta(days=2)
        ostermontag = ostern + timedelta(days=1)
        christi_himmelfahrt = ostern + timedelta(days=39)
        pfingstmontag = ostern + timedelta(days=50)
        fronleichnam = ostern + timedelta(days=60)
        
        # Fest codierte Feiertage für Baden-Württemberg
        feiertage = [
            {'datum': f'{jahr}-01-01', 'name': 'Neujahr', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': f'{jahr}-01-06', 'name': 'Heilige Drei Könige', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': karfreitag.strftime('%Y-%m-%d'), 'name': 'Karfreitag', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': ostermontag.strftime('%Y-%m-%d'), 'name': 'Ostermontag', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': f'{jahr}-05-01', 'name': 'Tag der Arbeit', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': christi_himmelfahrt.strftime('%Y-%m-%d'), 'name': 'Christi Himmelfahrt', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': pfingstmontag.strftime('%Y-%m-%d'), 'name': 'Pfingstmontag', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': fronleichnam.strftime('%Y-%m-%d'), 'name': 'Fronleichnam', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': f'{jahr}-10-03', 'name': 'Tag der Deutschen Einheit', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': f'{jahr}-11-01', 'name': 'Allerheiligen', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': f'{jahr}-12-25', 'name': '1. Weihnachtstag', 'hinweis': 'Gesetzlicher Feiertag'},
            {'datum': f'{jahr}-12-26', 'name': '2. Weihnachtstag', 'hinweis': 'Gesetzlicher Feiertag'},
        ]
        
        print(f"[FeiertagService] Fallback liefert {len(feiertage)} Feiertage")
        return feiertage
