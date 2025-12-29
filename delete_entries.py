from kalender.models import Mitarbeitereintrag
count = Mitarbeitereintrag.objects.count()
Mitarbeitereintrag.objects.all().delete()
print(f"Gelöscht: {count} Einträge")
