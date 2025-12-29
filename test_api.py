from rest_framework.test import APIClient
from django.contrib.auth.models import User

client = APIClient()

# Test ohne Auth
response = client.post('/api/mitarbeitertermine/', {
    'mitarbeiter': 1,
    'datum_start': '2025-12-30',
    'datum_ende': '2025-12-30',
    'titel': 'Test ohne Auth',
    'typ': 'termin',
    'ganztaegig': True
})
print(f'Test ohne Auth - Status: {response.status_code}')
if response.status_code != 201:
    print(f'Error: {response.data}')

# Test mit Auth
user = User.objects.first()
if user:
    client.force_authenticate(user=user)
    response = client.post('/api/mitarbeitertermine/', {
        'mitarbeiter': 1,
        'datum_start': '2025-12-30',
        'datum_ende': '2025-12-30',
        'titel': 'Test mit Auth',
        'typ': 'termin',
        'ganztaegig': True
    })
    print(f'Test mit Auth - Status: {response.status_code}')
    if response.status_code != 201:
        print(f'Error: {response.data}')
    else:
        print(f'Success: {response.data}')
