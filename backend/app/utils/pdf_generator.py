import io
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def create_receipt_pdf(receipt_data: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Center', alignment=1))
    
    Story = []
    
    # Header
    Story.append(Paragraph("<b>OPD Hospital Receipt</b>", styles['Title']))
    Story.append(Spacer(1, 12))
    Story.append(Paragraph(f"<b>Receipt ID:</b> {receipt_data['receipt_id']}", styles['Normal']))
    Story.append(Paragraph(f"<b>Date:</b> {receipt_data['date']}", styles['Normal']))
    Story.append(Spacer(1, 12))
    
    # Patient Info
    Story.append(Paragraph("<b>Patient Details:</b>", styles['Heading3']))
    Story.append(Paragraph(f"Name: {receipt_data['patient_name']}", styles['Normal']))
    Story.append(Paragraph(f"UHID: {receipt_data['patient_uhid']}", styles['Normal']))
    Story.append(Spacer(1, 12))
    
    # Payment Details Table
    data = [
        ['Description', 'Amount'],
        ['Consultation Fee / OPD Charges', "Included"],
    ]
    
    if receipt_data.get('medicines_list'):
        for med in receipt_data['medicines_list']:
            parts = med.split(': $')
            if len(parts) == 2:
                data.append([f"Medicine: {parts[0]}", f"${parts[1]}"])
            
    if receipt_data.get('insurance_payable') and receipt_data['insurance_payable'] > 0:
        data.append(['Gross Amount', f"${receipt_data['amount']:.2f}"])
        data.append(['Covered by Insurance / TPA', f"- ${receipt_data['insurance_payable']:.2f}"])
        data.append(['Patient Co-Pay (Net Payable)', f"${receipt_data['patient_payable']:.2f}"])
    else:
        data.append(['Total Paid', f"${receipt_data['amount']:.2f}"])

    data.append(['Payment Mode', receipt_data['payment_mode']])
    
    t = Table(data, colWidths=[300, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    Story.append(t)
    Story.append(Spacer(1, 24))
    
    Story.append(Paragraph("Thank you for choosing our hospital. Wishing you a speedy recovery!", styles['Center']))
    
    doc.build(Story)
    buffer.seek(0)
    return buffer
