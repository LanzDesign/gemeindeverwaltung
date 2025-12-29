from kalender.models import Mitarbeiter, MitarbeiterKategorie, Mitarbeitereintrag

print(f'Mitarbeiter: {Mitarbeiter.objects.count()}')
print(f'Kategorien: {MitarbeiterKategorie.objects.count()}')
print(f'Einträge: {Mitarbeitereintrag.objects.count()}')

print('\nMitarbeiter:')
for m in Mitarbeiter.objects.all():
    print(f'  - {m.vollstaendiger_name}')

print('\nKategorien:')
for k in MitarbeiterKategorie.objects.all():
    print(f'  - {k.bezeichnung} ({k.abkuerzung})')
