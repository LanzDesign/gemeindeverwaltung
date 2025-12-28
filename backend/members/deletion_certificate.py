from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Spacer, SimpleDocTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from io import BytesIO
from django.core.files.base import ContentFile
from datetime import datetime, timedelta
from django.utils import timezone

def generate_deletion_certificate_pdf(member, admin_user):
    """
    Generiert ein Datenlöschungs-Bestätigungszertifikat
    
    Args:
        member: Das Member-Objekt (gelöschtes Mitglied)
        admin_user: Der Admin der die Löschung durchgeführt hat
    
    Returns:
        BytesIO Buffer mit dem PDF
    """
    buffer = BytesIO()
    width, height = A4
    
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    story = []
    styles = getSampleStyleSheet()
    
    # Styles anpassen
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=(0, 0, 0),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=(0, 0, 0),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        alignment=TA_JUSTIFY,
        spaceAfter=12,
        leading=16
    )
    
    # Titel
    story.append(Paragraph("BESTÄTIGUNG DER DATENLÖSCHUNG", title_style))
    story.append(Spacer(1, 0.5*cm))
    
    # Zertifikat-ID
    cert_id = f"DEL-{member.id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    story.append(Paragraph(f"Zertifikat-ID: {cert_id}", body_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Ausstellungsdatum
    issue_date = datetime.now().strftime('%d.%m.%Y um %H:%M')
    story.append(Paragraph(f"Ausgestellt am: {issue_date}", body_style))
    story.append(Spacer(1, 1*cm))
    
    # Haupttext
    story.append(Paragraph("Hiermit wird bestätigt, dass die folgenden Daten vollständig gelöscht wurden:", heading_style))
    story.append(Spacer(1, 0.3*cm))
    
    # Mitglieddaten
    member_info = f"""
    <b>Mitglied:</b> {member.first_name} {member.last_name}<br/>
    <b>Geburtsdatum:</b> {member.date_of_birth.strftime('%d.%m.%Y') if member.date_of_birth else 'Nicht vorhanden'}<br/>
    <b>E-Mail:</b> {member.email if member.email else 'Nicht vorhanden'}<br/>
    <b>Telefon:</b> {member.phone if member.phone else 'Nicht vorhanden'}<br/>
    <b>Mitglieds-ID:</b> {member.id}<br/>
    <b>Löschzeitpunkt:</b> {member.deleted_at.strftime('%d.%m.%Y um %H:%M') if member.deleted_at else 'Nicht vorhanden'}<br/>
    <b>Gelöscht von:</b> {admin_user.get_full_name() or admin_user.username if admin_user else 'Unbekannt'}<br/>
    """
    story.append(Paragraph(member_info, body_style))
    story.append(Spacer(1, 0.8*cm))
    
    # Gelöschte Felder
    story.append(Paragraph("Gelöschte personenbezogene Daten:", heading_style))
    
    deleted_fields = """
    <b>Personendaten:</b><br/>
    • Familienname<br/>
    • Vorname<br/>
    • E-Mail-Adresse<br/>
    • Telefonnummer<br/>
    • Straße<br/>
    • Postleitzahl<br/>
    • Stadt<br/>
    • Geburtsdatum<br/>
    • Verheiratet seit<br/>
    • Heiratsort<br/>
    • Beruf<br/>
    • Nationalität<br/>
    <br/>
    <b>Gemeindedaten:</b><br/>
    • Mitgliedsstatus<br/>
    • Dienste (aktuell und gewünscht)<br/>
    • Anregungen der Gemeinde<br/>
    • Fotos und Signaturen<br/>
    • Datenschutzerklärung (PDF)<br/>
    <b>Datenschutz-Einwilligungen</b> (alle Felder)<br/>
    """
    story.append(Paragraph(deleted_fields, body_style))
    story.append(Spacer(1, 0.8*cm))
    
    # DSGVO Informationen
    story.append(Paragraph("DSGVO-Konformität", heading_style))
    
    dsgvo_info = """
    Die Löschung wurde gemäß Artikel 17 der Datenschutz-Grundverordnung (DSGVO) durchgeführt.
    Diese umfasst die Löschung aller personenbezogenen Daten zum Zeitpunkt der Anfrage.
    <br/><br/>
    Ausnahmen nach DSGVO Artikel 17, Absatz 3:<br/>
    • Erfüllung einer rechtlichen Verpflichtung<br/>
    • Wahrung von Rechtsansprüchen<br/>
    • Öffentliches Interesse<br/>
    • Archivierungszwecke von öffentlichem Interesse oder für wissenschaftliche und historische Forschungszwecke
    """
    story.append(Paragraph(dsgvo_info, body_style))
    story.append(Spacer(1, 0.8*cm))
    
    # Archivierungshinweis
    story.append(Paragraph("Hinweis zur Archivierung", heading_style))
    
    archive_info = """
    Dieses Zertifikat und die damit verbundenen Metadaten werden für 6 Jahre archiviert,
    um die Einhaltung der DSGVO und anderer Datenschutzbestimmungen nachzuweisen.
    Danach werden auch diese Daten gelöscht.
    """
    story.append(Paragraph(archive_info, body_style))
    story.append(Spacer(1, 1.5*cm))
    
    # Unterschrift
    story.append(Paragraph("_" * 80, body_style))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph("Unterschrift Administrator / Stempel", ParagraphStyle(
        'Signature',
        parent=styles['Normal'],
        fontSize=9,
        alignment=TA_LEFT
    )))
    
    # Footer
    story.append(Spacer(1, 1*cm))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=(128, 128, 128)
    )
    story.append(Paragraph(
        f"Freie-Evangeliums-Christengemeinde Lahr | Hans-Indurfurth-Straße 11 | 77933 Lahr<br/>Dieses Dokument ist eine offizielle Bestätigung der Datenlöschung",
        footer_style
    ))
    
    # PDF generieren
    doc.build(story)
    buffer.seek(0)
    return buffer

def save_deletion_certificate_to_member(member, admin_user):
    """
    Generiert Löschzertifikat und speichert es im Member-Objekt
    
    Args:
        member: Das Member-Objekt
        admin_user: Der Admin der die Löschung durchgeführt hat
    """
    pdf_buffer = generate_deletion_certificate_pdf(member, admin_user)
    filename = f"deletion_cert_{member.id}_{member.last_name}_{member.first_name}_{datetime.now().strftime('%Y%m%d')}.pdf"
    member.deletion_certificate_url.save(
        filename,
        ContentFile(pdf_buffer.read()),
        save=True
    )
    pdf_buffer.close()
    member.save()
