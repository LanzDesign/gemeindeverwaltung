"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
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
from django.utils import timezone
from datetime import timedelta
from django.http import JsonResponse
from members import auth_views
from members.admin_backup import backup_urlpatterns

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
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f'Fehlgeschlagener Login-Versuch für User: {username}')
        return Response({'detail': 'Ungültige Anmeldedaten'}, status=401)
    
    # Altes Token löschen, neues erstellen
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f'Erfolgreicher Login: {username}')
    
    # Gruppeninformationen sammeln
    user_groups = list(user.groups.values_list('name', flat=True))
    is_jugendleiter = 'Jugendleiter' in user_groups
    is_gemeindeallteste = 'Gemeindeälteste' in user_groups
    
    response = JsonResponse({
        'token': token.key, 
        'username': user.username,
        'groups': user_groups,
        'is_jugendleiter': is_jugendleiter,
        'is_gemeindeallteste': is_gemeindeallteste,
    })
    # Token als httpOnly Cookie setzen (sicherer als localStorage)
    response.set_cookie(
        'authToken', 
        token.key, 
        max_age=24*60*60,  # 24 Stunden
        httponly=True,      # Nicht von JavaScript zugreifbar
        secure=True,        # Nur über HTTPS
        samesite='Strict'   # CSRF-Schutz
    )
    return response

urlpatterns = [
    path('admin/backups/', include(backup_urlpatterns)),
    path('admin/', admin.site.urls),
    path('api/', include('members.urls')),
    path('api/', include('kalender.urls')),
    path('api/login/', custom_login, name='api_login'),
    path('api/auth/profile/', auth_views.profile_view, name='profile'),
    path('api/auth/change-password/', auth_views.change_password_view, name='change_password'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
