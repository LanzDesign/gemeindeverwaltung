# backend/members/serializers.py
from rest_framework import serializers
from .models import Member, ServiceTag, Familie, Gruppe, Feedback
from django.db import transaction
import json

class ServiceTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceTag
        fields = ['id', 'name']

class FeedbackSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Feedback
        fields = ['id', 'member', 'category', 'category_display', 'text', 'created_at']
        read_only_fields = ['created_at']

class MemberSerializer(serializers.ModelSerializer):
    current_services = ServiceTagSerializer(many=True, read_only=True)
    desired_services = ServiceTagSerializer(many=True, read_only=True)
    current_services_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, allow_empty=True
    )
    desired_services_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False, allow_empty=True
    )
    # Liefert eine gültige URL nur wenn Datei existiert; sonst None
    privacy_policy_pdf = serializers.SerializerMethodField()
    photo_thumb = serializers.SerializerMethodField()
    gruppen = serializers.SerializerMethodField()
    
    # Make email optional by explicitly defining it
    email = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Member
        fields = [
            'id', 'first_name', 'last_name', 
            'email', 'phone', 'street', 'postal_code', 'city',
            'photo', 'photo_thumb', 'signature', 'signature_location',
            'privacy_policy_pdf',
            'date_of_birth', 'married_since', 'marriage_location', 'profession', 'nationality',
            'status', 'is_donor', 'is_member', 'is_youth', 'is_child',
            'current_services', 'desired_services',
            'current_services_ids', 'desired_services_ids',
            'community_suggestions', 'gruppen',
            'privacy_membership', 'privacy_whatsapp', 'privacy_data_protection',
            'privacy_data_release', 'privacy_donation', 'privacy_children',
            'deleted_at', 'anonymized_at'
        ]
        read_only_fields = ['deleted_at', 'anonymized_at']

    def to_internal_value(self, data):
        """Parse JSON strings aus FormData vor der Validierung"""
        # QueryDict in normales dict umwandeln für Mutability
        if hasattr(data, 'getlist'):
            mutable_data = {}
            for key in data.keys():
                values = data.getlist(key)
                if len(values) == 1:
                    mutable_data[key] = values[0]
                else:
                    mutable_data[key] = values
            data = mutable_data
        
        # Parse JSON-Strings für Array-Felder
        for field_name in ['current_services_ids', 'desired_services_ids']:
            if field_name in data:
                val = data[field_name]
                if isinstance(val, str):
                    try:
                        parsed = json.loads(val) if val else []
                        data[field_name] = parsed
                    except (json.JSONDecodeError, ValueError):
                        data[field_name] = []
        
        # Handle empty email - convert empty string to empty string (not None)
        if 'email' in data and data['email'] == '':
            data['email'] = ''
        
        return super().to_internal_value(data)
    
    def validate_email(self, value):
        """Allow empty email - don't validate if empty"""
        if not value or value == '':
            return ''
        # If there's a value, validate it as email
        from django.core.validators import EmailValidator
        validator = EmailValidator()
        try:
            validator(value)
        except:
            raise serializers.ValidationError("Gib eine gültige E-Mail Adresse an.")
        return value

    def get_privacy_policy_pdf(self, obj):
        try:
            if obj.privacy_policy_pdf and hasattr(obj.privacy_policy_pdf, 'url'):
                return obj.privacy_policy_pdf.url
        except Exception:
            return None
        return None

    def get_photo_thumb(self, obj):
        try:
            # Prüfe ob das Feld existiert (Migration könnte fehlen)
            if hasattr(obj, 'photo_thumb') and obj.photo_thumb and hasattr(obj.photo_thumb, 'url'):
                return obj.photo_thumb.url
        except Exception:
            return None
        return None

    def get_gruppen(self, obj):
        """Liste der Gruppen, zu denen das Mitglied gehört"""
        return [{'id': g.id, 'name': g.name, 'size_type': g.size_type} for g in obj.gruppen.all()]

    def create(self, validated_data):
        current_services_ids = validated_data.pop('current_services_ids', [])
        desired_services_ids = validated_data.pop('desired_services_ids', [])
        
        member = Member.objects.create(**validated_data)
        if current_services_ids:
            member.current_services.set(current_services_ids)
        if desired_services_ids:
            member.desired_services.set(desired_services_ids)
        return member

    def update(self, instance, validated_data):
        current_services_ids = validated_data.pop('current_services_ids', None)
        desired_services_ids = validated_data.pop('desired_services_ids', None)
        
        # Update alle anderen Felder
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update ManyToMany Felder wenn vorhanden
        if current_services_ids is not None:
            instance.current_services.set(current_services_ids)
        if desired_services_ids is not None:
            instance.desired_services.set(desired_services_ids)
        
        return instance


class FamilieSerializer(serializers.ModelSerializer):
    vater_name = serializers.SerializerMethodField()
    mutter_name = serializers.SerializerMethodField()
    kinder_names = serializers.SerializerMethodField()

    # Zusätzliche, explizite ID-Felder (robuster bei Frontend Requests)
    vater_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    mutter_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    kinder_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Familie
        fields = [
            'id', 'name',
            'vater', 'mutter', 'kinder',
            'vater_id', 'mutter_id', 'kinder_ids',
            'vater_name', 'mutter_name', 'kinder_names'
        ]
        read_only_fields = ['vater_name', 'mutter_name', 'kinder_names']

    def get_vater_name(self, obj):
        return f"{obj.vater.first_name} {obj.vater.last_name}" if obj.vater else None

    def get_mutter_name(self, obj):
        return f"{obj.mutter.first_name} {obj.mutter.last_name}" if obj.mutter else None

    def get_kinder_names(self, obj):
        return [f"{k.first_name} {k.last_name}" for k in obj.kinder.all()]

    def _resolve_member(self, member_id):
        if member_id is None:
            return None
        try:
            return Member.objects.get(pk=member_id)
        except Member.DoesNotExist:
            raise serializers.ValidationError({
                'member': f'Member mit ID {member_id} existiert nicht.'
            })

    @transaction.atomic
    def create(self, validated_data):
        # Unterstützt sowohl direkte Beziehung (vater/mutter/kinder) als auch *_id Felder
        vater_id = validated_data.pop('vater_id', None)
        mutter_id = validated_data.pop('mutter_id', None)
        kinder_ids = validated_data.pop('kinder_ids', None)
        kinder_direct = validated_data.pop('kinder', [])  # Falls Frontend schon Member Objekte schickt

        if vater_id is not None and 'vater' not in validated_data:
            validated_data['vater'] = self._resolve_member(vater_id)
        if mutter_id is not None and 'mutter' not in validated_data:
            validated_data['mutter'] = self._resolve_member(mutter_id)

        familie = Familie.objects.create(**validated_data)

        final_kinder = []
        if kinder_ids is not None:
            for kid_id in kinder_ids:
                final_kinder.append(self._resolve_member(kid_id))
        elif kinder_direct:
            final_kinder = list(kinder_direct)

        if final_kinder:
            familie.kinder.set(final_kinder)

        return familie

    @transaction.atomic
    def update(self, instance, validated_data):
        vater_id = validated_data.pop('vater_id', None)
        mutter_id = validated_data.pop('mutter_id', None)
        kinder_ids = validated_data.pop('kinder_ids', None)
        kinder_direct = validated_data.pop('kinder', None)

        # Basisfelder
        if 'name' in validated_data:
            instance.name = validated_data['name']
        if vater_id is not None:
            instance.vater = self._resolve_member(vater_id)
        elif 'vater' in validated_data:
            instance.vater = validated_data['vater']  # bereits aufgelöst
        if mutter_id is not None:
            instance.mutter = self._resolve_member(mutter_id)
        elif 'mutter' in validated_data:
            instance.mutter = validated_data['mutter']
        instance.save()

        # Kinder aktualisieren (Leere Liste => löschen; None => unverändert)
        if kinder_ids is not None:
            resolved_children = [self._resolve_member(kid) for kid in kinder_ids]
            instance.kinder.set(resolved_children)
        elif kinder_direct is not None:
            instance.kinder.set(list(kinder_direct))

        return instance


class GruppeSerializer(serializers.ModelSerializer):
    ansprechpartner_names = serializers.SerializerMethodField()
    ansprechpartner_list = serializers.SerializerMethodField()
    ansprechpartner_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    parent_gruppe_name = serializers.SerializerMethodField()
    untergruppen_list = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(read_only=True, source='members.count')
    members_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Gruppe
        fields = [
            'id', 'name', 'size_type', 'description',
            'parent_gruppe', 'parent_gruppe_name', 'untergruppen_list',
            'ansprechpartner_names', 'ansprechpartner_list', 'ansprechpartner_ids',
            'members', 'members_list', 'member_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'ansprechpartner_names', 'ansprechpartner_list', 'parent_gruppe_name', 'untergruppen_list', 'members_list', 'member_count']
    
    def get_ansprechpartner_names(self, obj):
        """Komma-separierte Namen aller Ansprechpartner"""
        ansprechpartner = obj.ansprechpartner.all()
        if ansprechpartner:
            return ", ".join([f"{a.first_name} {a.last_name}" for a in ansprechpartner])
        return None
    
    def get_ansprechpartner_list(self, obj):
        """Liste mit Details aller Ansprechpartner"""
        return [
            {
                'id': a.id,
                'first_name': a.first_name,
                'last_name': a.last_name,
                'email': a.email
            }
            for a in obj.ansprechpartner.all()
        ]
    
    def get_parent_gruppe_name(self, obj):
        if obj.parent_gruppe:
            return obj.parent_gruppe.name
        return None
    
    def get_untergruppen_list(self, obj):
        """Liste der Untergruppen (nur für große Gruppen relevant)"""
        if obj.size_type == 'large':
            return [
                {
                    'id': ug.id,
                    'name': ug.name,
                    'member_count': ug.members.count()
                }
                for ug in obj.untergruppen.all()
            ]
        return []
    
    def get_members_list(self, obj):
        return [
            {
                'id': m.id,
                'first_name': m.first_name,
                'last_name': m.last_name,
                'email': m.email,
                'phone': m.phone,
                'city': m.city,
                'status': m.status,
                'is_donor': m.is_donor,
                'services': [s.name for s in m.current_services.all()],
                'desired_services': [s.name for s in m.desired_services.all()],
                'privacy_accepted': bool(m.privacy_policy_pdf),
                'date_of_birth': m.date_of_birth.isoformat() if m.date_of_birth else None
            }
            for m in obj.members.all()
        ]
    
    def create(self, validated_data):
        members_data = validated_data.pop('members', [])
        ansprechpartner_ids = validated_data.pop('ansprechpartner_ids', [])
        gruppe = Gruppe.objects.create(**validated_data)
        if members_data:
            gruppe.members.set(members_data)
        if ansprechpartner_ids:
            gruppe.ansprechpartner.set(ansprechpartner_ids)
        return gruppe
    
    def update(self, instance, validated_data):
        members_data = validated_data.pop('members', None)
        ansprechpartner_ids = validated_data.pop('ansprechpartner_ids', None)
        
        # Update alle anderen Felder
        instance.name = validated_data.get('name', instance.name)
        instance.size_type = validated_data.get('size_type', instance.size_type)
        instance.description = validated_data.get('description', instance.description)
        instance.parent_gruppe = validated_data.get('parent_gruppe', instance.parent_gruppe)
        instance.save()
        
        # Update ManyToMany Felder wenn vorhanden
        if members_data is not None:
            instance.members.set(members_data)
        if ansprechpartner_ids is not None:
            instance.ansprechpartner.set(ansprechpartner_ids)
        
        return instance