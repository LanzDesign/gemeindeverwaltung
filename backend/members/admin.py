# members/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Member, Familie, Feedback, ServiceTag, Gruppe
from .pdf_generator import save_privacy_policy_to_member


# Admin-Site Anpassungen
admin.site.site_header = "FECG Lahr Verwaltung"
admin.site.site_title = "FECG Admin"
admin.site.index_title = "Willkommen im FECG Verwaltungsportal"


# Custom Admin Index mit Backup-Link
class BackupLinkMixin:
    """Fügt Backup-Link zum Admin hinzu"""
    
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['backup_url'] = reverse('backup_dashboard')
        return super().changelist_view(request, extra_context=extra_context)

# 1. ServiceTag Admin
@admin.register(ServiceTag)
class ServiceTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    search_fields = ('name',)

# 2. Inlines für Member
class FamilieVaterInline(admin.TabularInline):
    model = Familie
    fk_name = "vater"
    verbose_name = "Familie (als Vater)"
    verbose_name_plural = "Familien (als Vater)"
    extra = 0

class FamilieMutterInline(admin.TabularInline):
    model = Familie
    fk_name = "mutter"
    verbose_name = "Familie (als Mutter)"
    verbose_name_plural = "Familien (als Mutter)"
    extra = 0

class FeedbackInline(admin.StackedInline):
    model = Feedback
    extra = 0

# 3. Member Admin
@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'date_of_birth', 'is_member', 'email', 'phone', 'status', 'photo_preview', 'signature_preview', 'privacy_pdf_link')
    search_fields = ('last_name', 'first_name', 'email')
    list_filter = ('status', 'is_donor', 'is_member')
    
    # Familie-Inlines wieder aktivieren
    inlines = [FamilieVaterInline, FamilieMutterInline, FeedbackInline]
    
    autocomplete_fields = ['current_services', 'desired_services']
    
    actions = ['generate_privacy_pdf']
    
    readonly_fields = ('photo_tag', 'signature_tag', 'regenerate_pdf_button')
    
    # No need to exclude marriage_location - field is commented out in model

    def photo_preview(self, obj):
        if obj.photo:
            try:
                return format_html('<img src="{}" style="max-width:50px; max-height:50px; border-radius: 50%;" />', obj.photo.url)
            except ValueError:
                return "Fehler"
        return "-"
    photo_preview.short_description = 'Foto'

    def signature_preview(self, obj):
        if obj.signature:
            try:
                return format_html('<img src="{}" style="max-width:100px; max-height:30px;" />', obj.signature.url)
            except ValueError:
                return "Fehler"
        return "-"
    signature_preview.short_description = 'Unterschrift'

    def photo_tag(self, obj):
        if obj.photo:
            try:
                return format_html('<img src="{}" style="max-width:300px; border-radius: 10px;" />', obj.photo.url)
            except ValueError:
                return "Datei nicht gefunden"
        return "Kein Foto vorhanden"
    photo_tag.short_description = 'Foto (Vorschau)'

    def signature_tag(self, obj):
        if obj.signature:
            try:
                return format_html('<img src="{}" style="max-width:400px; border: 1px solid #ccc; padding: 5px;" />', obj.signature.url)
            except ValueError:
                return "Datei nicht gefunden"
        return "Keine Unterschrift vorhanden"
    signature_tag.short_description = 'Unterschrift (Vorschau)'

    def privacy_pdf_link(self, obj):
        if obj.privacy_policy_pdf:
            try:
                return format_html('<a href="{}" target="_blank">PDF herunterladen</a>', obj.privacy_policy_pdf.url)
            except ValueError:
                return "Fehler"
        return "-"
    privacy_pdf_link.short_description = 'Datenschutz-PDF'

    def regenerate_pdf_button(self, obj):
        """
        Zeigt einen Button an, um das PDF manuell neu zu erstellen
        """
        if obj.pk:  # Nur bei bestehenden Members
            return format_html(
                '<a class="button" href="/admin/members/member/{}/regenerate-pdf/">🔄 PDF neu erstellen</a>',
                obj.pk
            )
        return "-"
    regenerate_pdf_button.short_description = 'PDF-Aktionen'

    def generate_privacy_pdf(self, request, queryset):
        """
        Admin-Action: Generiert Datenschutz-PDFs für ausgewählte Members
        """
        count = 0
        for member in queryset:
            try:
                save_privacy_policy_to_member(member)
                count += 1
            except Exception as e:
                self.message_user(request, f"Fehler bei {member}: {str(e)}", level='error')
        
        self.message_user(request, f"{count} Datenschutz-PDF(s) erfolgreich erstellt.", level='success')
    
    generate_privacy_pdf.short_description = "📄 Datenschutz-PDF erstellen (für ausgewählte Members)"

# 4. Familie Admin
@admin.register(Familie)
class FamilieAdmin(admin.ModelAdmin):
    list_display = ('name', 'vater', 'mutter')
    search_fields = ('name',)
    autocomplete_fields = ['vater', 'mutter']
    filter_horizontal = ('kinder',)

# 5. Gruppe Admin
@admin.register(Gruppe)
class GruppeAdmin(admin.ModelAdmin):
    list_display = ('name', 'size_type', 'member_count', 'ansprechpartner_names_display')
    search_fields = ('name', 'description')
    list_filter = ('size_type',)
    filter_horizontal = ('members', 'ansprechpartner')
    
    def ansprechpartner_names_display(self, obj):
        """Display comma-separated list of contact persons"""
        names = [f"{a.first_name} {a.last_name}" for a in obj.ansprechpartner.all()]
        return ", ".join(names) if names else "-"
    ansprechpartner_names_display.short_description = "Ansprechpartner"