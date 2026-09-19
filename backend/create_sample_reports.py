import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw, ImageFont

output_dir = os.path.join(os.path.dirname(__file__), '..')

# 1. Baseline Report: July 2026
doc1_path = os.path.join(output_dir, 'sample_cbc_july.pdf')
c1 = canvas.Canvas(doc1_path, pagesize=letter)
c1.setFont("Helvetica-Bold", 16)
c1.drawString(60, 740, "Apollo Diagnostics & Clinical Laboratory")
c1.setFont("Helvetica", 10)
c1.drawString(60, 725, "124 Healthcare Boulevard, Medical Enclave")
c1.drawString(60, 705, "Patient Name: Test Patient      Age: 38      Gender: M")
c1.drawString(60, 690, "Report Date: 10/07/2026         Sample ID: AP-98210")
c1.line(60, 680, 540, 680)

c1.setFont("Helvetica-Bold", 12)
c1.drawString(60, 655, "COMPLETE BLOOD COUNT (CBC)")
c1.setFont("Helvetica-Bold", 9)
c1.drawString(60, 635, "Test Parameter | Value | Unit | Reference Range")
c1.line(60, 630, 540, 630)

c1.setFont("Helvetica", 9)
tests1 = [
    "Hemoglobin | 11.5 | g/dL | 12.0 - 16.0",
    "RBC Count | 4.1 | mill/mm3 | 4.5 - 5.5",
    "WBC Count | 7200 | /uL | 4000 - 11000",
    "Platelet Count | 210000 | /uL | 150000 - 450000",
    "Fasting Blood Glucose | 108 | mg/dL | 70 - 99",
    "Total Cholesterol | 215 | mg/dL | < 200",
    "Serum Creatinine | 0.9 | mg/dL | 0.6 - 1.2",
    "Blood Urea Nitrogen | 14.0 | mg/dL | 7.0 - 20.0"
]
y = 610
for t in tests1:
    c1.drawString(60, y, t)
    y -= 22

c1.setFont("Helvetica-Oblique", 8)
c1.drawString(60, 200, "End of laboratory examination report. Verified by Chief Pathologist.")
c1.save()
print(f"Created {doc1_path}")

# 2. Follow-up Report: September 2026
doc2_path = os.path.join(output_dir, 'sample_cbc_sept.pdf')
c2 = canvas.Canvas(doc2_path, pagesize=letter)
c2.setFont("Helvetica-Bold", 16)
c2.drawString(60, 740, "Apollo Diagnostics & Clinical Laboratory")
c2.setFont("Helvetica", 10)
c2.drawString(60, 725, "124 Healthcare Boulevard, Medical Enclave")
c2.drawString(60, 705, "Patient Name: Test Patient      Age: 38      Gender: M")
c2.drawString(60, 690, "Report Date: 18/09/2026         Sample ID: AP-99432")
c2.line(60, 680, 540, 680)

c2.setFont("Helvetica-Bold", 12)
c2.drawString(60, 655, "COMPLETE BLOOD COUNT (CBC)")
c2.setFont("Helvetica-Bold", 9)
c2.drawString(60, 635, "Test Parameter | Value | Unit | Reference Range")
c2.line(60, 630, 540, 630)

c2.setFont("Helvetica", 9)
tests2 = [
    "Hemoglobin | 12.8 | g/dL | 12.0 - 16.0",
    "RBC Count | 4.6 | mill/mm3 | 4.5 - 5.5",
    "WBC Count | 6800 | /uL | 4000 - 11000",
    "Platelet Count | 230000 | /uL | 150000 - 450000",
    "Fasting Blood Glucose | 94 | mg/dL | 70 - 99",
    "Total Cholesterol | 188 | mg/dL | < 200",
    "Serum Creatinine | 0.9 | mg/dL | 0.6 - 1.2",
    "Blood Urea Nitrogen | 13.5 | mg/dL | 7.0 - 20.0"
]
y = 610
for t in tests2:
    c2.drawString(60, y, t)
    y -= 22

c2.setFont("Helvetica-Oblique", 8)
c2.drawString(60, 200, "End of laboratory examination report. Verified by Chief Pathologist.")
c2.save()
print(f"Created {doc2_path}")

# 3. Create Image Report for OCR testing
img_path = os.path.join(output_dir, 'sample_report_image.png')
img = Image.new('RGB', (1000, 600), color=(255, 255, 255))
draw = ImageDraw.Draw(img)

draw.text((40, 40), "Metropolis Healthcare & Clinical Labs", fill=(0, 0, 0))
draw.text((40, 70), "Report Date: 2026-09-15", fill=(50, 50, 50))
draw.line([(40, 100), (960, 100)], fill=(150, 150, 150), width=2)
draw.text((40, 120), "Test Parameter | Value | Unit | Reference Range", fill=(0, 0, 0))
draw.line([(40, 145), (960, 145)], fill=(200, 200, 200), width=1)

y = 165
for item in [
    "Hemoglobin | 14.2 | g/dL | 12.0 - 16.0",
    "Fasting Glucose | 96 | mg/dL | 70 - 99",
    "Platelets | 280000 | /uL | 150000 - 450000",
    "Total Cholesterol | 175 | mg/dL | < 200"
]:
    draw.text((40, y), item, fill=(0, 0, 0))
    y += 40

img.save(img_path)
print(f"Created {img_path}")
