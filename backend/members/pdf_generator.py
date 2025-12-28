from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Table, TableStyle
from io import BytesIO
from django.core.files.base import ContentFile
import os
from datetime import datetime
from PIL import Image
try:
    from PyPDF2 import PdfReader, PdfWriter
    HAS_PYPDF2 = True
except ImportError:
    HAS_PYPDF2 = False

def draw_checkbox(c, x, y, checked=False, size=3.5*mm):
    """Zeichnet eine Checkbox mit optionalem Häkchen"""
    # Box zeichnen
    c.rect(x, y, size, size, stroke=1, fill=0)
    
    # Häkchen wenn checked - verwende ✓ Symbol
    if checked:
        # Zeichne ein Häkchen manuell (zwei Linien)
        c.setLineWidth(0.8)
        # Erste Linie (schräg nach unten rechts)
        c.line(x + 0.8*mm, y + 1.8*mm, x + 1.4*mm, y + 0.8*mm)
        # Zweite Linie (schräg nach oben rechts)
        c.line(x + 1.4*mm, y + 0.8*mm, x + 2.8*mm, y + 2.8*mm)
        c.setLineWidth(1)

def add_page_numbers(pdf_buffer):
    """Fügt Seitenzahlen zu einem bestehenden PDF hinzu"""
    if not HAS_PYPDF2:
        return pdf_buffer
    
    try:
        pdf_buffer.seek(0)
        reader = PdfReader(pdf_buffer)
        writer = PdfWriter()
        total_pages = len(reader.pages)
        
        for page_num, page in enumerate(reader.pages, start=1):
            # Erstelle Overlay mit Seitenzahl
            packet = BytesIO()
            can = canvas.Canvas(packet, pagesize=A4)
            width, height = A4
            
            can.setFont("Helvetica", 9)
            footer_text = f"Seite {page_num} von {total_pages}"
            can.drawCentredString(width/2, 1.5*cm, footer_text)
            can.save()
            
            # Merge overlay mit Page
            packet.seek(0)
            overlay_pdf = PdfReader(packet)
            page.merge_page(overlay_pdf.pages[0])
            writer.add_page(page)
        
        # Schreibe result
        output = BytesIO()
        writer.write(output)
        output.seek(0)
        return output
    except Exception as e:
        print(f"Error adding page numbers: {e}")
        pdf_buffer.seek(0)
        return pdf_buffer

def generate_privacy_policy_pdf(member, checkbox_settings=None):
    """
    Erstellt die Datenschutzerklärung 1:1 nach FECG Lahr Vorlage mit Tabelle
    
    Args:
        member: Das Member-Objekt
        checkbox_settings: Dict mit Checkbox-Einstellungen (membership, whatsapp, dataProtection, dataRelease, donation, children)
                          Wenn None, werden alle als True gesetzt
    """
    # Default: alle Checkboxen angekreuzt
    if checkbox_settings is None:
        checkbox_settings = {
            'membership': True,
            'whatsapp': True,
            'dataProtection': True,
            'dataRelease': True,
            'donation': True,
            'children': True,
        }
    
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # === SEITE 1 ===
    
    # Überschrift
    p.setFont("Helvetica-Bold", 13)
    p.drawCentredString(width/2, height - 2.5*cm, "Einwilligungserklärung betreffend Datenverarbeitung")
    
    y = height - 4*cm
    
    # Persönliche Daten - als richtige Tabelle
    p.setFont("Helvetica", 10)
    
    # Tabellendaten vorbereiten
    table_data = [
        ["Name, Vorname:", f"{member.last_name}, {member.first_name}"],
        ["Adresse:", f"{member.street if member.street else ''}, {member.postal_code if member.postal_code else ''} {member.city if member.city else ''}".strip().strip(',')],
        ["E-Mail-Adresse:", member.email if member.email else ""],
        ["Handynummer:", member.phone if member.phone else ""],
        ["Geburtsdatum:", member.date_of_birth.strftime('%d.%m.%Y') if member.date_of_birth else ""],
    ]
    
    # Tabelle mit festen Spaltenbreiten
    col_widths = [4.5*cm, 11.5*cm]
    table = Table(table_data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, (0, 0, 0)),  # Schwarze Rahmenlinien
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    # Tabelle zeichnen
    table_width, table_height = table.wrapOn(p, width, height)
    table.drawOn(p, 2*cm, y - table_height)
    
    y -= (table_height + 1*cm)
    
    # Haupttext
    p.setFont("Helvetica", 9.5)
    birth_date = member.date_of_birth.strftime('%d.%m.%Y') if member.date_of_birth else '______________'
    
    text_lines = [
        f"Ich, {member.first_name} {member.last_name}, geb. am {birth_date}, stimme der Nutzung, Speicherung und",
        "Übermittlung meiner Daten zu Vereinszwecken zu.",
        "",
        "Mir ist bewusst, dass die Einrichtung von mir bekanntgegebene Daten und Informationen verarbeiten muss.",
        "Ohne diese Datenverarbeitung ist eine Mitgliedschaft, Begleitung, Kinder- und Jugendbetreuung im Verein",
        "nicht möglich. Weiter ist mir bewusst, dass meine Daten an zuständige Stellen (Vorstand, Verwaltung,",
        "Leitung, Jugend- und Kinderbetreuer, sowie an die in der Datenschutzerklärung genannten Dritten)",
        "weitergeleitet werden.",
        "",
        "Ich stimme hiermit ausdrücklich zu, dass die Einrichtung",
    ]
    
    for line in text_lines:
        p.drawString(2*cm, y, line)
        y -= 0.5*cm
    
    # Gemeinde Info
    y -= 0.2*cm
    p.setFont("Helvetica-Bold", 10)
    p.drawString(3*cm, y, "Freie-Evangeliums-Christengemeinde Lahr")
    y -= 0.5*cm
    p.setFont("Helvetica", 9.5)
    p.drawString(3*cm, y, "Hans-Inderfurth-Straße 11")
    y -= 0.5*cm
    p.drawString(3*cm, y, "77933 Lahr")
    
    y -= 0.8*cm
    p.drawString(2*cm, y, "die von mir bekanntgegebenen personenbezogenen Daten und Informationen zu den jeweils angeführten")
    y -= 0.5*cm
    p.drawString(2*cm, y, "Zwecken speichern und verarbeiten darf (zutreffendes bitte ankreuzen):")
    
    y -= 1*cm
    
    # Checkboxen - Verwende checkbox_settings
    checkbox_items = [
        {
            "checked": checkbox_settings.get('membership') if 'membership' in checkbox_settings else True,
            "lines": [
                "Zum Zweck meiner Mitgliedschaft, Betreuung, Betreuung meiner minderjährigen Kinder,",
                "Vereinsleben und Vereinsführung in der FECG Lahr verarbeitet und gespeichert werden.",
                "Dabei nehme ich zur Kenntnis, dass meine Daten an Leiter, Verwaltung, Kinder- und",
                "Jugendbetreuer und sonstige freiwillige Mitarbeiter der FECG Lahr weitergegeben werden."
            ]
        },
        {
            "checked": checkbox_settings.get('whatsapp') if 'whatsapp' in checkbox_settings else True,
            "lines": ["Zu Kommunikations- und Informationszwecken der Messengerdienst WhatsApp verwendet wird."]
        },
        {
            "checked": checkbox_settings.get('dataProtection') if 'dataProtection' in checkbox_settings else True,
            "lines": ["Stimme zu, dass ich die Datenschutzerklärung erhalten, gelesen und verstanden habe."]
        },
        {
            "checked": checkbox_settings.get('dataRelease') if 'dataRelease' in checkbox_settings else True,
            "lines": [
                "Stimme zu, dass meine Daten an Leiter, Kinder- und Jugendbetreuer und sonstige freiwillige",
                "Mitarbeiter der FECG Lahr zur internen Nutzung weitergegeben werden."
            ]
        },
        {
            "checked": checkbox_settings.get('donation') if 'donation' in checkbox_settings else True,
            "lines": [
                "Stimme zu, dass meine Daten zur Erstellung einer Spendenbescheinigung gespeichert und an den",
                "Steuerberater weitergegeben werden."
            ]
        },
        {
            "checked": checkbox_settings.get('children') if 'children' in checkbox_settings else True,
            "lines": [
                "Stimme zu, dass die Daten meiner minderjährigen Kinder an Leiter, Betreuer und sonstige",
                "freiwillige Mitarbeiter der FECG Lahr zur internen Nutzung weitergegeben werden."
            ]
        },
    ]
    
    # Checkboxen zeichnen mit automatischem Seitenumbruch
    for item in checkbox_items:
        # Prüfe ob genug Platz (mind. 3cm für mehrzeilige Items)
        needed_space = len(item["lines"]) * 0.5*cm + 0.5*cm
        if y < (4*cm + needed_space):
            # === NEUE SEITE ===
            p.showPage()
            y = height - 2*cm
            p.setFont("Helvetica", 9.5)
        
        # Checkbox zeichnen
        draw_checkbox(p, 2*cm, y - 3*mm, checked=item["checked"])
        
        # Textzeilen
        for i, line in enumerate(item["lines"]):
            line_y = y - (i * 0.5*cm)
            p.drawString(3*cm, line_y, line)
        
        y -= (len(item["lines"]) * 0.5*cm + 0.5*cm)
    
    # Widerrufsrecht
    if y < 5*cm:
        p.showPage()
        y = height - 2*cm
        p.setFont("Helvetica", 9.5)
    
    y -= 0.3*cm
    p.drawString(2*cm, y, "Ich kann diese Einwilligung jederzeit schriftlich per E-Mail an fecgverwaltung@gmail.com widerrufen.")
    
    y -= 1.2*cm
    
    # === HINWEIS-BEREICH ===
    if y < 10*cm:
        p.showPage()
        y = height - 2*cm
    
    p.setFont("Helvetica-Bold", 10)
    p.drawString(2*cm, y, "HINWEIS:")
    y -= 0.6*cm
    
    p.setFont("Helvetica", 9.5)
    p.drawString(2*cm, y, "Im Rahmen der Verarbeitung meiner personenbezogenen Daten stehen mir neben dem jederzeitigen")
    y -= 0.5*cm
    p.drawString(2*cm, y, "Widerrufsrecht folgende Rechte zu:")
    
    y -= 0.7*cm
    
    rights = [
        "• Recht auf Auskunft",
        "• Recht auf Berichtigung",
        "• Recht auf Löschung",
        "• Recht auf Einschränkung der Verarbeitung",
        "• Recht auf Datenübertragbarkeit"
    ]
    
    for right in rights:
        p.drawString(2.5*cm, y, right)
        y -= 0.5*cm
    
    y -= 0.4*cm
    p.drawString(2*cm, y, "Nähere Ausführungen zu meinen Rechten finde ich in der deutschen Fassung der DSGVO")
    y -= 0.5*cm
    p.drawString(2*cm, y, "(http://eur-lex.europa.eu/legal-content/DE/TXT/PDF/?uri=CELEX:32016R0679&from=DE).")
    
    y -= 0.8*cm
    p.drawString(2*cm, y, "Wenn ich der Meinung bin, dass die Verarbeitung meiner Daten gegen die DSGVO oder eine andere")
    y -= 0.5*cm
    p.drawString(2*cm, y, "datenschutzrelevante Vorschrift verstößt, steht es mir frei, bei der Datenschutzbehörde")
    y -= 0.5*cm
    p.drawString(2*cm, y, "(www.bfdi.bund.de) Beschwerde zu erheben.")
    
    # === UNTERSCHRIFTENBEREICH ===
    if y < 6*cm:
        p.showPage()
        y = height - 2*cm
    else:
        y -= 3*cm
    
    # Ort, Datum, Unterschrift
    location = member.signature_location if member.signature_location else (member.city if member.city else "Lahr")
    current_date = datetime.now().strftime('%d.%m.%Y')
    
    # Linien zeichnen
    p.line(2*cm, y, 6*cm, y)
    p.line(8*cm, y, 11*cm, y)
    p.line(12*cm, y, 18*cm, y)
    
    # Werte über den Linien eintragen
    p.setFont("Helvetica", 10)
    p.drawString(2*cm, y + 2*mm, location)
    p.drawString(8*cm, y + 2*mm, current_date)
    
    # Unterschrift als Bild einfügen
    if member.signature:
        try:
            signature_path = member.signature.path
            if os.path.exists(signature_path):
                img_pil = Image.open(signature_path)
                
                if img_pil.mode == 'RGBA':
                    background = Image.new('RGB', img_pil.size, (255, 255, 255))
                    background.paste(img_pil, mask=img_pil.split()[3])
                    img_pil = background
                
                img_buffer = BytesIO()
                img_pil.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                img = ImageReader(img_buffer)
                # Unterschrift über der Linie positionieren - volle Breite nutzen
                p.drawImage(img, 12*cm, y + 2*mm, width=6*cm, height=1.3*cm, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
    
    # Labels unter den Linien
    p.setFont("Helvetica", 8)
    p.drawString(2*cm, y - 5*mm, "Ort")
    p.drawString(8*cm, y - 5*mm, "Datum")
    p.drawString(12*cm, y - 5*mm, "Unterschrift")
    
    p.save()
    
    buffer.seek(0)
    
    # Füge Seitenzahlen hinzu
    buffer_with_pages = add_page_numbers(buffer)
    
    return buffer_with_pages

def save_privacy_policy_to_member(member, checkbox_settings=None):
    """
    Generiert PDF und speichert es im Member-Objekt
    
    Args:
        member: Das Member-Objekt
        checkbox_settings: Optional - Dict mit Checkbox-Einstellungen
    """
    # Default: alle Checkboxen angekreuzt
    if checkbox_settings is None:
        checkbox_settings = {
            'membership': True,
            'whatsapp': True,
            'dataProtection': True,
            'dataRelease': True,
            'donation': True,
            'children': True,
        }
    
    # Speichere die Checkbox-Einstellungen in den privacy_* Feldern
    member.privacy_membership = checkbox_settings.get('membership', True)
    member.privacy_whatsapp = checkbox_settings.get('whatsapp', True)
    member.privacy_data_protection = checkbox_settings.get('dataProtection', True)
    member.privacy_data_release = checkbox_settings.get('dataRelease', True)
    member.privacy_donation = checkbox_settings.get('donation', True)
    member.privacy_children = checkbox_settings.get('children', True)
    
    pdf_buffer = generate_privacy_policy_pdf(member, checkbox_settings)
    filename = f"datenschutz_{member.last_name}_{member.first_name}.pdf"
    member.privacy_policy_pdf.save(filename, ContentFile(pdf_buffer.read()), save=True)
    pdf_buffer.close()
    
    # WICHTIG: Nochmal save() aufrufen, um die privacy_* Felder zu speichern
    # (Das save=True beim PDF speichert nur das PDF-Feld)
    member.save()
