from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django.http import JsonResponse

# Falls diese Module existieren (aus deiner alten Datei übernommen)
try:
    from members import auth_views
    from members.admin_backup import backup_urlpatterns
except ImportError:
    auth_views = None
    backup_urlpatterns = []

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def custom_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'detail': 'Username und Passwort erforderlich'}, status=400)
    
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'detail': 'Ungültige Anmeldedaten'}, status=401)
    
    # Altes Token löschen, neues erstellen
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    
    user_groups = list(user.groups.values_list('name', flat=True))
    
    response = JsonResponse({
        'token': token.key, 
        'username': user.username,
        'groups': user_groups,
        'is_jugendleiter': 'Jugendleiter' in user_groups,
        'is_gemeindeallteste': 'Gemeindeälteste' in user_groups,
    })

    response.set_cookie(
        'authToken', 
        token.key, 
        max_age=24*60*60,
        httponly=True,
        secure=True,
        samesite='Strict'
    )
    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    # Der Login-Pfad, den dein Frontend sucht:
    path('login/', custom_login, name='api_login'),
    
    # API Includes (nur wenn die Apps/Ordner existieren)
    path('api/members/', include('members.urls')),
    path('api/kalender/', include('kalender.urls')),
]

# Backups nur einbinden, wenn vorhanden
if backup_urlpatterns:
    path('admin/backups/', include(backup_urlpatterns)),

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
