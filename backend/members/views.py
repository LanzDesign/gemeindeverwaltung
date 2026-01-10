# members/views.py
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.authentication import TokenAuthentication
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Member, ServiceTag, Familie, Gruppe, Feedback
from .serializers import MemberSerializer, ServiceTagSerializer, FamilieSerializer, GruppeSerializer, FeedbackSerializer
from .pdf_generator import save_privacy_policy_to_member
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
import json
from django.shortcuts import redirect
from django.contrib import messages
import logging
import traceback
from django.http import FileResponse
import os

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def custom_login(request):
    # Debug: Log Request-Body
    print("Request Content-Type:", request.content_type)
    print("Request Body (raw):", request.body)
    
    try:
        # Manuell JSON parsen (falls Django es nicht automatisch macht)
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST
        
        username = data.get('username')
        password = data.get('password')
    except Exception as e:
        return Response({'error': f'JSON-Parsing-Fehler: {str(e)}'}, status=400)
    
    if not username or not password:
        return Response({'error': 'Username und Password sind erforderlich'}, status=400)
    
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': 'Ungültige Anmeldedaten'}, status=401)
    
    token, created = Token.objects.get_or_create(user=user)
    return Response({'token': token.key}, status=200)

# WICHTIG: CSRF-Schutz deaktivieren, damit POST-Requests vom Frontend durchgehen
@method_decorator(csrf_exempt, name='dispatch')
class MemberViewSet(viewsets.ModelViewSet):
    """
    API-Endpunkt, der es erlaubt, Mitglieder anzusehen oder zu bearbeiten.
    """
    queryset = Member.objects.all().order_by('last_name')
    serializer_class = MemberSerializer
    # Erlaubt jedem (auch ohne Login) den Zugriff
    permission_classes = [AllowAny]
    # Wichtig für Datei-Uploads (Bilder/Unterschriften)
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # WICHTIG: Leere Liste verhindert, dass SessionAuthentication (falls global aktiv)
    # einen CSRF-Check durchführt. Das löst den "CSRF token missing" Fehler.
    authentication_classes = []
    
    def create(self, request, *args, **kwargs):
        try:
            # Debug: Zeige an, welche Daten ankommen
            print("=== Member Create Request ===")
            print("Data Keys:", request.data.keys())
            print("Content-Type:", request.content_type)
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print("=== ERROR in MemberViewSet.create ===")
            traceback.print_exc()
            return Response({
                'error': 'Internal Server Error',
                'message': str(e),
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }, status=500)
    
    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            print("=== ERROR in MemberViewSet.update ===")
            traceback.print_exc()
            return Response({
                'error': 'Fehler beim Aktualisieren',
                'message': str(e),
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }, status=500)
    
    def partial_update(self, request, *args, **kwargs):
        try:
            print("=== Member Partial Update Request ===")
            print("Member ID:", kwargs.get('pk'))
            print("Data Keys:", request.data.keys() if hasattr(request.data, 'keys') else 'N/A')
            print("Content-Type:", request.content_type)
            return super().partial_update(request, *args, **kwargs)
        except Exception as e:
            print("=== ERROR in MemberViewSet.partial_update ===")
            traceback.print_exc()
            return Response({
                'error': 'Fehler beim Aktualisieren',
                'message': str(e),
                'type': type(e).__name__,
                'traceback': traceback.format_exc()
            }, status=500)

    def get_permissions(self):
        # POST (Create) und download_pdf sind öffentlich, alles andere nur für Admins
        if getattr(self, 'action', None) in ['create', 'download_pdf']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_authenticators(self):
        # POST (Create) und download_pdf brauchen keine Authentifizierung
        if getattr(self, 'action', None) in ['create', 'download_pdf']:
            return []
        return [TokenAuthentication()]
    
    def get_queryset(self):
        """Filter: Standardmäßig nur aktive (nicht gelöschte) Mitglieder"""
        queryset = Member.objects.all().order_by('last_name')
        
        # Bei restore, trash und permanent_delete Actions alle Mitglieder anzeigen (auch gelöschte)
        if getattr(self, 'action', None) in ['restore', 'trash', 'permanent_delete', 'download_deletion_certificate']:
            return queryset
        
        # Admin kann mit ?show_deleted=true gelöschte sehen
        show_deleted = self.request.query_params.get('show_deleted', 'false').lower() == 'true'
        if not show_deleted:
            queryset = queryset.filter(deleted_at__isnull=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """
        Nach dem Speichern des Members wird automatisch das Datenschutz-PDF erstellt
        """
        try:
            member = serializer.save()
            try:
                # PDF generieren und speichern
                save_privacy_policy_to_member(member)
            except Exception as e:
                # Fehler loggen, aber nicht abstürzen lassen. Das Mitglied ist wichtiger als das PDF.
                logger.error(f"Fehler bei PDF-Generierung für Member {member.id}: {e}")
                print(f"Fehler bei PDF-Generierung: {e}")
        except Exception as e:
            logger.error(f"Fehler beim Speichern des Members: {e}")
            raise e
    
    def destroy(self, request, *args, **kwargs):
        """Überschreibe DELETE für Soft-Delete statt echtes Löschen"""
        member = self.get_object()
        user = request.user if request.user.is_authenticated else None
        member.soft_delete(user=user)
        return Response({'message': 'Mitglied in Papierkorb verschoben'}, status=200)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def restore(self, request, pk=None):
        """Mitglied aus Papierkorb wiederherstellen"""
        member = self.get_object()
        if not member.deleted_at:
            return Response({'error': 'Mitglied ist nicht gelöscht'}, status=400)
        member.restore()
        return Response({'message': 'Mitglied wiederhergestellt'}, status=200)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def trash(self, request):
        """Liste aller gelöschten Mitglieder (Papierkorb)"""
        deleted_members = Member.objects.filter(deleted_at__isnull=False, anonymized_at__isnull=True).order_by('-deleted_at')
        serializer = self.get_serializer(deleted_members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def assign_family(self, request, pk=None):
        """
        Ordnet ein Mitglied einer Familie zu bzw. setzt die Rolle in der Familie.
        Body (eine der beiden Varianten):
          { "family_id": int, "role": "vater"|"mutter"|"kind" }
          { "family_name": str, "role": "vater"|"mutter"|"kind" }
        - Erstellt die Familie, falls family_name angegeben ist und sie nicht existiert
        - Setzt vater/mutter oder fügt das Mitglied als Kind hinzu
        """
        member = self.get_object()
        family_id = request.data.get('family_id')
        family_name = request.data.get('family_name')
        role = request.data.get('role')

        if not role:
            return Response({'error': 'role ist erforderlich'}, status=400)

        familie = None
        if family_id:
            try:
                familie = Familie.objects.get(pk=family_id)
            except Familie.DoesNotExist:
                return Response({'error': 'Familie nicht gefunden'}, status=404)
        elif family_name:
            familie, _created = Familie.objects.get_or_create(name=family_name)
        else:
            return Response({
                'error': 'Entweder family_id oder family_name ist erforderlich'
            }, status=400)

        if role == 'vater':
            familie.vater = member
            familie.save()
        elif role == 'mutter':
            familie.mutter = member
            familie.save()
        elif role == 'kind':
            familie.kinder.add(member)
        else:
            return Response({'error': 'Ungültige Rolle'}, status=400)

        # Leichtgewichtige Antwort
        data = {
            'id': familie.id,
            'name': familie.name,
            'vater_id': familie.vater_id,
            'mutter_id': familie.mutter_id,
            'kinder_ids': list(familie.kinder.values_list('id', flat=True))
        }
        return Response({'message': 'Familie zugeordnet', 'familie': data}, status=200)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def regenerate_pdf(self, request, pk=None):
        """
        Regeneriert das Datenschutz-PDF für ein Mitglied
        """
        member = self.get_object()
        try:
            save_privacy_policy_to_member(member)
            return Response({'message': 'PDF erfolgreich erstellt', 'pdf_url': member.privacy_policy_pdf.url})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def regenerate_privacy_pdf(self, request, pk=None):
        """
        Regeneriert das Datenschutz-PDF für ein Mitglied (Alias für regenerate_pdf)
        Akzeptiert optionale privacy_settings im Request-Body
        """
        member = self.get_object()
        try:
            # Hole privacy_settings aus Request-Body
            privacy_settings = request.data.get('privacy_settings', None)
            save_privacy_policy_to_member(member, privacy_settings)
            # Refresh member von DB um die gespeicherten privacy_* Felder zu haben
            member.refresh_from_db()
            # Serialisiere Member um die aktuellen Daten zurückzugeben
            from .serializers import MemberSerializer
            serialized_data = MemberSerializer(member).data
            return Response({
                'message': 'PDF erfolgreich erstellt', 
                'pdf_url': member.privacy_policy_pdf.url,
                'member': serialized_data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def update_signature(self, request, pk=None):
        """
        Aktualisiert die Unterschrift eines Mitglieds und regeneriert die PDF
        Akzeptiert:
        - signature: File upload (Bild der Unterschrift)
        - signature_location: String (Ort der Unterzeichnung)
        """
        member = self.get_object()
        try:
            # Update signature if provided
            if 'signature' in request.FILES:
                member.signature = request.FILES['signature']
                member.save()
            
            # Update signature location if provided
            if 'signature_location' in request.data:
                member.signature_location = request.data['signature_location']
                member.save()
            
            # Regenerate PDF with new signature
            save_privacy_policy_to_member(member)
            member.refresh_from_db()
            
            from .serializers import MemberSerializer
            serialized_data = MemberSerializer(member).data
            
            return Response({
                'message': 'Unterschrift aktualisiert und PDF regeneriert',
                'pdf_url': member.privacy_policy_pdf.url,
                'member': serialized_data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated], parser_classes=[MultiPartParser, FormParser])
    def upload_photo(self, request, pk=None):
        """
        Ladet ein Foto für ein Mitglied hoch
        Akzeptiert:
        - photo: File upload (Bild des Mitglieds)
        """
        member = self.get_object()
        try:
            if 'photo' in request.FILES:
                member.photo = request.FILES['photo']
                member.save()
                
                from .serializers import MemberSerializer
                serialized_data = MemberSerializer(member).data
                
                return Response({
                    'message': 'Foto erfolgreich hochgeladen',
                    'photo_url': member.photo.url if member.photo else None,
                    'member': serialized_data
                })
            else:
                return Response({'error': 'Keine Fotodatei gefunden'}, status=400)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def download_pdf(self, request, pk=None):
        """
        Sicherer Download des PDFs über Django (Fallback falls Nginx 404 gibt)
        URL: /api/members/<id>/download_pdf/
        """
        member = self.get_object()
        if member.privacy_policy_pdf:
            try:
                file_path = member.privacy_policy_pdf.path
                if os.path.exists(file_path):
                    return FileResponse(
                        open(file_path, 'rb'),
                        content_type='application/pdf',
                        as_attachment=True,
                        filename=f'datenschutz_{member.last_name}_{member.first_name}.pdf'
                    )
                else:
                    return Response({'error': f'Datei nicht gefunden: {file_path}'}, status=404)
            except Exception as e:
                return Response({'error': f'Fehler beim Laden: {str(e)}'}, status=500)
        return Response({'error': 'Kein PDF für dieses Mitglied hinterlegt'}, status=404)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def permanent_delete(self, request, pk=None):
        """
        Permanente Löschung eines Mitglieds mit Löschzertifikat (DSGVO Artikel 17)
        
        Body: {
            "confirm": true
        }
        
        Returns:
            - Löschzertifikat (PDF)
            - Bestätigung über Datenlöschung
        """
        member = self.get_object()
        
        # Bestätigung erforderlich
        if not request.data.get('confirm'):
            return Response({
                'error': 'Bestätigung erforderlich',
                'message': f'Alle Daten von {member.first_name} {member.last_name} werden permanent gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.'
            }, status=400)
        
        try:
            from .deletion_certificate import save_deletion_certificate_to_member
            from django.utils import timezone
            
            # Speichere Namen für Benachrichtigung
            member_name = f"{member.first_name} {member.last_name}"
            member_email = member.email
            
            # Generiere Löschzertifikat
            admin_user = request.user if request.user.is_authenticated else None
            save_deletion_certificate_to_member(member, admin_user)
            
            # Markiere als permanent gelöscht
            member.deleted_at = timezone.now()
            member.deleted_by = admin_user
            
            # Anonymisiere alle Daten
            member.first_name = "Gelöscht"
            member.last_name = f"[ID:{member.id}]"
            member.email = ""
            member.phone = ""
            member.street = ""
            member.postal_code = ""
            member.city = ""
            member.date_of_birth = None
            member.married_since = None
            member.marriage_location = ""
            member.profession = ""
            member.nationality = ""
            
            # Lösche Fotos und Unterschriften
            if member.photo:
                member.photo.delete()
            if member.photo_thumb:
                member.photo_thumb.delete()
            if member.signature:
                member.signature.delete()
            
            # Setze Anonymisierungs-Flag
            member.anonymized_at = timezone.now()
            
            # Speichere Änderungen
            member.save()
            
            # Entferne aus Diensten und Gruppen
            member.current_services.clear()
            member.desired_services.clear()
            member.gruppen.clear()
            
            # Optional: E-Mail Benachrichtigung versenden
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                if member_email and hasattr(settings, 'EMAIL_HOST'):
                    send_mail(
                        subject='Bestätigung: Ihre Daten wurden gelöscht',
                        message=f'Sehr geehrte/r {member_name},\n\nwir bestätigen hiermit die vollständige Löschung Ihrer personenbezogenen Daten aus unserem System gemäß DSGVO Artikel 17.\n\nEin Löschzertifikat wurde erstellt und archiviert.\n\nMit freundlichen Grüßen,\nFreie-Evangeliums-Christengemeinde Lahr',
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[member_email],
                        fail_silently=True
                    )
            except Exception as email_error:
                logger.warning(f"E-Mail-Benachrichtigung konnte nicht gesendet werden: {email_error}")
            
            return Response({
                'message': f'Mitglied {member_name} wurde permanent gelöscht',
                'certificate_url': member.deletion_certificate_url.url if member.deletion_certificate_url else None,
                'deleted_at': member.deleted_at.isoformat(),
                'anonymized_at': member.anonymized_at.isoformat()
            }, status=200)
            
        except Exception as e:
            logger.error(f"Fehler bei permanenter Löschung: {str(e)}\n{traceback.format_exc()}")
            return Response({'error': f'Fehler bei der Löschung: {str(e)}'}, status=500)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def download_deletion_certificate(self, request, pk=None):
        """
        Download des Löschzertifikats als PDF
        URL: /api/members/<id>/download_deletion_certificate/
        """
        member = self.get_object()
        if member.deletion_certificate_url:
            try:
                file_path = member.deletion_certificate_url.path
                if os.path.exists(file_path):
                    return FileResponse(
                        open(file_path, 'rb'),
                        content_type='application/pdf',
                        as_attachment=True,
                        filename=f'loeschzertifikat_{member.last_name}_{member.first_name}.pdf'
                    )
                else:
                    return Response({'error': 'Zertifikat-Datei nicht gefunden'}, status=404)
            except Exception as e:
                return Response({'error': f'Fehler beim Laden: {str(e)}'}, status=500)
        return Response({'error': 'Kein Löschzertifikat für dieses Mitglied vorhanden'}, status=404)

def regenerate_pdf_view(request, pk):

    """
    View zum manuellen Neu-Erstellen des PDFs
    """
    member = Member.objects.get(pk=pk)
    try:
        save_privacy_policy_to_member(member)
        messages.success(request, f"Datenschutz-PDF für {member} erfolgreich erstellt.")
    except Exception as e:
        messages.error(request, f"Fehler beim Erstellen: {str(e)}")
    
    return redirect(f'/admin/members/member/{pk}/change/')

class ServiceTagViewSet(viewsets.ModelViewSet):
    """
    API-Endpunkt für die Dienste (Tags). Wird für die Auswahl im Frontend gebraucht.
    """
    queryset = ServiceTag.objects.all().order_by('name')
    serializer_class = ServiceTagSerializer
    # HIER WICHTIG: Damit das Frontend die Liste laden kann ohne Login
    permission_classes = [AllowAny]
    authentication_classes = []


class FamilieViewSet(viewsets.ModelViewSet):
    queryset = Familie.objects.all().order_by('name')
    serializer_class = FamilieSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]


class GruppeViewSet(viewsets.ModelViewSet):
    """
    API-Endpunkt für Gruppen. Erlaubt CRUD-Operationen und Verwaltung von Mitgliedern.
    """
    queryset = Gruppe.objects.all().order_by('name')
    serializer_class = GruppeSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    @action(detail=True, methods=['post'])
    def add_members(self, request, pk=None):
        """Fügt Mitglieder zur Gruppe hinzu mit hierarchischer Validierung"""
        gruppe = self.get_object()
        member_ids = request.data.get('member_ids', [])
        
        if not isinstance(member_ids, list):
            return Response({'error': 'member_ids muss eine Liste sein'}, status=400)
        
        members = Member.objects.filter(id__in=member_ids)
        
        # Validierung: Prüfe für jedes Mitglied
        for member in members:
            # Prüfe ob Mitglied bereits in einer Gruppe dieser Größe ist
            existing_groups = member.gruppen.filter(size_type=gruppe.size_type)
            
            if existing_groups.exists():
                existing_group_names = ", ".join([g.name for g in existing_groups])
                return Response({
                    'error': f'{member.first_name} {member.last_name} ist bereits in folgender {"großen" if gruppe.size_type == "large" else "kleinen"} Gruppe: {existing_group_names}.',
                    'message': 'Bitte entfernen Sie das Mitglied zuerst aus der aktuellen Gruppe, bevor Sie es einer neuen zuordnen.'
                }, status=400)
            
            # Hierarchische Prüfung: Wenn neue große Gruppe, darf keine kleine Gruppe vorhanden sein
            if gruppe.size_type == 'large':
                small_groups = member.gruppen.filter(size_type='small')
                if small_groups.exists():
                    small_group_names = ", ".join([g.name for g in small_groups])
                    return Response({
                        'error': f'{member.first_name} {member.last_name} ist noch in folgender kleinen Gruppe: {small_group_names}.',
                        'message': 'Hierarchische Regel: Bitte entfernen Sie das Mitglied zuerst aus allen kleinen Gruppen, bevor Sie es einer großen Gruppe zuordnen.'
                    }, status=400)
        
        # AUTOMATISCHE GRUPPENZUORDNUNG: Wenn kleine Gruppe mit parent_gruppe,
        # füge Mitglieder zuerst zur übergeordneten Gruppe hinzu (falls noch nicht vorhanden)
        if gruppe.size_type == 'small' and gruppe.parent_gruppe:
            print(f"[DEBUG] Kleine Gruppe '{gruppe.name}' hat Parent: '{gruppe.parent_gruppe.name}'")
            for member in members:
                if not gruppe.parent_gruppe.members.filter(id=member.id).exists():
                    print(f"[DEBUG] Füge {member.first_name} {member.last_name} zu Parent-Gruppe '{gruppe.parent_gruppe.name}' hinzu")
                    gruppe.parent_gruppe.members.add(member)
                else:
                    print(f"[DEBUG] {member.first_name} {member.last_name} ist bereits in Parent-Gruppe")
        else:
            print(f"[DEBUG] Keine automatische Zuordnung: size_type={gruppe.size_type}, has_parent={gruppe.parent_gruppe is not None}")
        
        # Füge Mitglieder zur Gruppe hinzu
        gruppe.members.add(*members)
        
        serializer = self.get_serializer(gruppe)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def remove_members(self, request, pk=None):
        """Entfernt Mitglieder aus der Gruppe"""
        gruppe = self.get_object()
        member_ids = request.data.get('member_ids', [])
        
        if not isinstance(member_ids, list):
            return Response({'error': 'member_ids muss eine Liste sein'}, status=400)
        
        members = Member.objects.filter(id__in=member_ids)
        gruppe.members.remove(*members)
        
        # AUTOMATISCHE GRUPPENZUORDNUNG: Wenn Mitglied aus kleiner Gruppe (z.B. 1-1) entfernt wird,
        # auch aus der übergeordneten großen Gruppe (z.B. 1) entfernen
        if gruppe.size_type == 'small' and gruppe.parent_gruppe:
            for member in members:
                # Nur entfernen wenn das Mitglied in keiner anderen kleinen Gruppe dieser großen Gruppe ist
                other_small_groups_with_member = Gruppe.objects.filter(
                    size_type='small',
                    parent_gruppe=gruppe.parent_gruppe,
                    members=member
                ).exclude(id=gruppe.id).exists()
                
                if not other_small_groups_with_member:
                    gruppe.parent_gruppe.members.remove(member)
        
        serializer = self.get_serializer(gruppe)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def change_ansprechpartner(self, request, pk=None):
        """Ändert den Ansprechpartner der Gruppe"""
        gruppe = self.get_object()
        ansprechpartner_id = request.data.get('ansprechpartner_id')
        
        if ansprechpartner_id:
            try:
                ansprechpartner = Member.objects.get(id=ansprechpartner_id)
                gruppe.ansprechpartner = ansprechpartner
                gruppe.save()
                
                serializer = self.get_serializer(gruppe)
                return Response(serializer.data)
            except Member.DoesNotExist:
                return Response({'error': 'Mitglied nicht gefunden'}, status=404)
        else:
            # Ansprechpartner entfernen
            gruppe.ansprechpartner = None
            gruppe.save()
            
            serializer = self.get_serializer(gruppe)
            return Response(serializer.data)

@method_decorator(csrf_exempt, name='dispatch')
class FeedbackViewSet(viewsets.ModelViewSet):
    """
    API-Endpunkt für Feedbacks/Anregungen
    """
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]
    
    def get_queryset(self):
        """Filter feedbacks by member_id if provided"""
        queryset = super().get_queryset()
        member_id = self.request.query_params.get('member_id', None)
        if member_id is not None:
            queryset = queryset.filter(member_id=member_id)
        return queryset