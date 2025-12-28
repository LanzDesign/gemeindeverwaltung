# members/auth_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    GET: Profil-Daten des angemeldeten Users abrufen
    PATCH: Profil-Daten aktualisieren (email, first_name, last_name)
    """
    user = request.user
    
    if request.method == 'GET':
        user_groups = list(user.groups.values_list('name', flat=True))
        return Response({
            'username': user.username,
            'email': user.email or '',
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'groups': user_groups,
            'is_jugendleiter': 'Jugendleiter' in user_groups,
            'is_gemeindeallteste': 'Gemeindeälteste' in user_groups,
        })
    
    elif request.method == 'PATCH':
        # Nur email, first_name, last_name können geändert werden
        user.email = request.data.get('email', user.email)
        user.first_name = request.data.get('first_name', user.first_name)
        user.last_name = request.data.get('last_name', user.last_name)
        user.save()
        
        return Response({
            'message': 'Profil erfolgreich aktualisiert',
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Passwort ändern
    Body: { "current_password": "...", "new_password": "..." }
    """
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response(
            {'error': 'Aktuelles und neues Passwort sind erforderlich'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Prüfe aktuelles Passwort
    if not user.check_password(current_password):
        return Response(
            {'error': 'Aktuelles Passwort ist falsch'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Setze neues Passwort
    if len(new_password) < 8:
        return Response(
            {'error': 'Passwort muss mindestens 8 Zeichen lang sein'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Passwort erfolgreich geändert'})
