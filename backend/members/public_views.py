"""
Public API views for member registration without authentication
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from .models import Member, Familie
from .serializers import MemberSerializer
from .pdf_generator import save_privacy_policy_to_member
import json


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def public_register(request):
    """
    Public endpoint for self-registration with FormData support
    
    Accepts multipart/form-data with:
    - All member fields (first_name, last_name, email, etc.)
    - signature: File upload
    - signature_location: String
    - privacy_* fields: Boolean consent flags
    - family_action: "create" or "join"
    - family_code: String (if joining)
    - children: JSON string array
    """
    print("=== PUBLIC REGISTER CALLED ===")
    print(f"Request method: {request.method}")
    print(f"Content-Type: {request.content_type}")
    print(f"Data keys: {list(request.data.keys())[:20]}")  # First 20 keys
    
    try:
        with transaction.atomic():
            # Extract data from FormData
            data = request.data
            
            # DEBUG: Log received data
            print("=== PUBLIC REGISTER DEBUG ===")
            print(f"Data keys: {list(data.keys())}")
            print(f"Has person2_first_name: {'person2_first_name' in data}")
            
            # Check if we have person1 and person2 (new two-parent structure)
            has_person2 = 'person2_first_name' in data
            
            # Build person1 data
            person1_data = {
                'first_name': data.get('person1_first_name', ''),
                'last_name': data.get('person1_last_name', ''),
                'email': data.get('person1_email', ''),
                'phone': data.get('person1_phone', ''),
                'street': data.get('person1_street', ''),
                'postal_code': data.get('person1_postal_code', ''),
                'city': data.get('person1_city', ''),
                'date_of_birth': data.get('person1_date_of_birth'),
                'married_since': data.get('person1_married_since'),
                'profession': data.get('person1_profession', ''),
                'nationality': data.get('person1_nationality', 'Deutsch'),
                'status': 'guest',
                'is_member': False,
                'is_donor': False,
                'is_youth': data.get('person1_is_youth') == 'true',
                'is_child': False,
                
                # Signature and location
                'signature_location': data.get('signature_location', 'Lahr'),
                
                # Privacy consents (same for all people)
                'privacy_membership': data.get('privacy_membership') == 'true',
                'privacy_whatsapp': data.get('privacy_whatsapp') == 'true',
                'privacy_data_protection': data.get('privacy_data_protection') == 'true',
                'privacy_data_release': data.get('privacy_data_release') == 'true',
                'privacy_donation': data.get('privacy_donation') == 'true',
                'privacy_children': data.get('privacy_children') == 'true',
            }
            
            # Check for duplicate email
            if person1_data.get('email'):
                existing = Member.objects.filter(email=person1_data['email']).first()
                if existing:
                    return Response(
                        {"error": "Diese E-Mail-Adresse ist bereits registriert."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create person1
            serializer = MemberSerializer(data=person1_data)
            if serializer.is_valid():
                person1 = serializer.save()
                
                # Handle signature file upload
                if 'signature' in request.FILES:
                    person1.signature = request.FILES['signature']
                    person1.save()
                
                # Handle photo file upload
                if 'photo' in request.FILES:
                    person1.photo = request.FILES['photo']
                    person1.save()
                
                # Generate privacy policy PDF
                try:
                    save_privacy_policy_to_member(person1)
                except Exception as e:
                    print(f"Error generating PDF for person1: {str(e)}")
            else:
                print(f"Person1 validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            person2 = None
            if has_person2:
                # Build person2 data
                person2_data = {
                    'first_name': data.get('person2_first_name', ''),
                    'last_name': data.get('person2_last_name', ''),
                    'email': data.get('person2_email', ''),
                    'phone': data.get('person2_phone', ''),
                    'street': data.get('person2_street', ''),
                    'postal_code': data.get('person2_postal_code', ''),
                    'city': data.get('person2_city', ''),
                    'date_of_birth': data.get('person2_date_of_birth'),
                    'married_since': data.get('person2_married_since'),
                    'profession': data.get('person2_profession', ''),
                    'nationality': data.get('person2_nationality', 'Deutsch'),
                    'status': 'guest',
                    'is_member': False,
                    'is_donor': False,
                    'is_youth': data.get('person2_is_youth') == 'true',
                    'is_child': False,
                    
                    # Signature and location (same as person1)
                    'signature_location': data.get('signature_location', 'Lahr'),
                    
                    # Privacy consents (same for all people)
                    'privacy_membership': data.get('privacy_membership') == 'true',
                    'privacy_whatsapp': data.get('privacy_whatsapp') == 'true',
                    'privacy_data_protection': data.get('privacy_data_protection') == 'true',
                    'privacy_data_release': data.get('privacy_data_release') == 'true',
                    'privacy_donation': data.get('privacy_donation') == 'true',
                    'privacy_children': data.get('privacy_children') == 'true',
                }
                
                # Check for duplicate email
                if person2_data.get('email'):
                    existing = Member.objects.filter(email=person2_data['email']).first()
                    if existing:
                        return Response(
                            {"error": "Diese E-Mail-Adresse ist bereits registriert (Elternteil 2)."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                # Create person2
                serializer2 = MemberSerializer(data=person2_data)
                if serializer2.is_valid():
                    person2 = serializer2.save()
                    
                    # Handle signature file upload (same for both)
                    if 'signature' in request.FILES:
                        person2.signature = request.FILES['signature']
                        person2.save()
                    
                    # Generate privacy policy PDF for person2
                    try:
                        save_privacy_policy_to_member(person2)
                    except Exception as e:
                        print(f"Error generating PDF for person2: {str(e)}")
                else:
                    return Response(serializer2.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle family
            family = None
            family_action = data.get('family_action', 'create')
            
            if has_person2:
                # If we have two people, always create a family with both as vater and mutter
                family_name = f"{person1.first_name} {person1.last_name} & {person2.first_name} {person2.last_name}"
                family = Familie.objects.create(name=family_name)
                family.vater = person1
                family.mutter = person2
                family.save()
                
            elif family_action == 'join':
                # Join existing family
                family_code = data.get('family_code', '').strip().upper()
                if not family_code:
                    return Response(
                        {"error": "Familien-Code erforderlich zum Beitreten."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                family = Familie.objects.filter(family_code=family_code).first()
                if not family:
                    return Response(
                        {"error": f"Familie mit Code '{family_code}' nicht gefunden."},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Add person1 to family based on available role
                if not family.vater:
                    family.vater = person1
                elif not family.mutter:
                    family.mutter = person1
                family.save()
                
            elif family_action == 'create':
                # Create new family with person1 as vater
                family_name = f"{person1.first_name} {person1.last_name}"
                family = Familie.objects.create(name=family_name)
                family.vater = person1
                family.save()
            
            # family_action == 'none' -> no family assignment
            
            # Handle children (sent as JSON string)
            children_json = data.get('children', '[]')
            try:
                children_data = json.loads(children_json) if isinstance(children_json, str) else children_json
            except (json.JSONDecodeError, ValueError):
                children_data = []
            
            created_children = []
            primary_person = person1  # Use person1 as default address source
            
            for child_data in children_data:
                child_member_data = {
                    'first_name': child_data.get('first_name', ''),
                    'last_name': child_data.get('last_name', primary_person.last_name),
                    'date_of_birth': child_data.get('date_of_birth'),
                    'status': 'guest',
                    'is_member': False,
                    'is_child': True,
                    'street': primary_person.street,
                    'postal_code': primary_person.postal_code,
                    'city': primary_person.city,
                }
                
                child_serializer = MemberSerializer(data=child_member_data)
                if child_serializer.is_valid():
                    child = child_serializer.save()
                    
                    # Add child to family
                    if family:
                        family.kinder.add(child)
                    
                    # Generate privacy policy PDF for child
                    try:
                        save_privacy_policy_to_member(child)
                    except Exception as e:
                        print(f"Error generating PDF for child: {str(e)}")
                    
                    created_children.append(child)
            
            # Prepare response
            response_data = {
                "success": True,
                "message": "Registrierung erfolgreich!",
                "person1": MemberSerializer(person1).data,
                "person2": MemberSerializer(person2).data if person2 else None,
                "family_code": family.family_code if family else None,
                "family_name": family.name if family else None,
                "children_count": len(created_children)
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response(
            {"error": f"Ein Fehler ist aufgetreten: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_family_code(request):
    """
    Verify if a family code exists
    
    Query params: ?code=ABCD1234
    """
    family_code = request.GET.get('code', '').strip().upper()
    
    if not family_code:
        return Response(
            {"valid": False, "message": "Kein Code angegeben."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    family = Familie.objects.filter(family_code=family_code).first()
    
    if family:
        return Response({
            "valid": True,
            "family_name": family.name,
            "message": f"Familie '{family.name}' gefunden."
        })
    else:
        return Response({
            "valid": False,
            "message": "Familien-Code nicht gefunden."
        })
