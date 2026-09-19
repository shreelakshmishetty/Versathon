import os
from pathlib import Path
from datetime import datetime
from typing import List, Optional, Dict, Any

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

from app.config import GENERATED_REPORTS_DIRECTORY
from app.utils.status_evaluator import get_status_label


class NumberedCanvas(canvas.Canvas):
    """Adds page numbers and header/footer rules to every page."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Top banner
        self.drawString(40, 810, "H2 – AI Medical Report Explanation System")
        self.drawRightString(555, 810, "Confidential Educational Summary")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 804, 555, 804)

        # Bottom banner
        self.line(40, 45, 555, 45)
        self.drawString(40, 32, "Generated for educational purposes only • Not a medical diagnosis")
        self.drawRightString(555, 32, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


class PDFReportGenerator:
    def __init__(self, output_dir: str = GENERATED_REPORTS_DIRECTORY):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_summary_pdf(
        self,
        report_id: int,
        user_name: str,
        original_filename: str,
        report_date: Optional[str],
        laboratory_name: Optional[str],
        summary_text: str,
        tests: List[Dict[str, Any]],
        comparisons: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Generates a professional, easy-to-read PDF summary of the medical report.
        """
        pdf_path = self.output_dir / f"h2_report_{report_id}_summary.pdf"

        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=55,
            bottomMargin=55
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0f766e')
        )
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569')
        )
        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=17,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor('#1e293b')
        )
        table_header_style = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.white
        )
        table_cell_style = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#0f172a')
        )
        table_cell_bold = ParagraphStyle(
            'TableCellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor('#0f172a')
        )
        expl_style = ParagraphStyle(
            'TestExplanation',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_title = ParagraphStyle(
            'DiscTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#991b1b')
        )
        disclaimer_text = ParagraphStyle(
            'DiscText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=11.5,
            textColor=colors.HexColor('#7f1d1d')
        )

        story = []

        # Document Title Header
        story.append(Paragraph("H2 – Medical Report Explanation", title_style))
        story.append(Paragraph("AI-Assisted Educational Summary • Non-Diagnostic Patient Companion", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f766e'), spaceAfter=12))

        # Metadata Card / Table
        date_display = report_date if report_date else "Not specified on report"
        lab_display = laboratory_name if laboratory_name else "Not detected"

        meta_data = [
            [
                Paragraph(f"<b>Patient / User:</b> {user_name}", body_style),
                Paragraph(f"<b>Report Date:</b> {date_display}", body_style)
            ],
            [
                Paragraph(f"<b>Source File:</b> {original_filename}", body_style),
                Paragraph(f"<b>Laboratory / Facility:</b> {lab_display}", body_style)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[260, 255])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 12))

        # Overall Summary Section
        story.append(Paragraph("Overall Report Summary", section_heading))
        summary_content = [
            [Paragraph(summary_text or "This report contains extracted laboratory tests for educational reference.", body_style)]
        ]
        summary_table = Table(summary_content, colWidths=[515])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0fdfa')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#99f6e4')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 14))

        # Test Results Section
        story.append(Paragraph(f"Extracted Test Results ({len(tests)} Tests)", section_heading))

        table_rows = [
            [
                Paragraph("Test Parameter", table_header_style),
                Paragraph("Reported Value", table_header_style),
                Paragraph("Reference Range", table_header_style),
                Paragraph("Status & Educational Explanation", table_header_style)
            ]
        ]

        for t in tests:
            t_name = t.get('test_name', 'Unknown')
            val = f"{t.get('value', 'N/A')} {t.get('unit') or ''}".strip()
            ref = t.get('reference_range') or 'Not provided'
            status_code = t.get('status', 'unknown')
            status_str = get_status_label(status_code)
            expl = t.get('explanation') or t.get('simple_explanation') or 'Educational summary unavailable.'

            # Status pill indicator color
            if status_code == 'within_range':
                status_color = "#047857"  # green
            elif status_code in ('below_range', 'above_range'):
                status_color = "#b45309"  # amber/orange
            else:
                status_color = "#475569"  # slate

            status_html = f"<font color='{status_color}'><b>[{status_str}]</b></font><br/>{expl}"

            table_rows.append([
                Paragraph(t_name, table_cell_bold),
                Paragraph(val, table_cell_style),
                Paragraph(ref, table_cell_style),
                Paragraph(status_html, expl_style)
            ])

        col_widths = [115, 85, 95, 220]
        results_table = Table(table_rows, colWidths=col_widths, repeatRows=1)
        results_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f766e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(results_table)
        story.append(Spacer(1, 14))

        # Historical Comparison Section (if provided)
        if comparisons and len(comparisons) > 0:
            comp_story = []
            comp_story.append(Paragraph("Historical Comparison with Previous Report", section_heading))
            comp_rows = [
                [
                    Paragraph("Test Parameter", table_header_style),
                    Paragraph("Previous Value", table_header_style),
                    Paragraph("Current Value", table_header_style),
                    Paragraph("Change / Delta", table_header_style),
                    Paragraph("Comparison Assessment", table_header_style)
                ]
            ]
            for c in comparisons:
                c_name = c.get('test_name', 'Test')
                old_v = f"{c.get('previous', 'N/A')} {c.get('unit') or ''}".strip()
                new_v = f"{c.get('current', 'N/A')} {c.get('unit') or ''}".strip()
                delta = c.get('change', '0.00')
                pct = c.get('pct_change')
                pct_str = f" ({pct})" if pct else ""
                status_desc = c.get('description') or (
                    f"Value changed from {c.get('previous')} to {c.get('current')} {c.get('unit') or ''}." if c.get('status') == 'comparable' else c.get('reason', 'Results cannot be reliably compared.')
                )

                comp_rows.append([
                    Paragraph(c_name, table_cell_bold),
                    Paragraph(old_v, table_cell_style),
                    Paragraph(new_v, table_cell_style),
                    Paragraph(f"<b>{delta}</b>{pct_str}", table_cell_style),
                    Paragraph(status_desc, expl_style)
                ])

            comp_table = Table(comp_rows, colWidths=[110, 80, 80, 85, 160], repeatRows=1)
            comp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            comp_story.append(comp_table)
            comp_story.append(Spacer(1, 14))
            story.append(KeepTogether(comp_story))

        # Medical Disclaimer Box (Mandatory on every PDF)
        disclaimer_box = [
            [
                Paragraph("⚠️ MANDATORY MEDICAL DISCLAIMER", disclaimer_title)
            ],
            [
                Paragraph(
                    "This application provides AI-assisted explanations of information contained in uploaded medical reports. "
                    "It is not a diagnosis and does not replace professional medical advice. Always consult a qualified "
                    "healthcare professional for interpretation of medical results and decisions about treatment.",
                    disclaimer_text
                )
            ]
        ]
        disclaimer_table = Table(disclaimer_box, colWidths=[515])
        disclaimer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fef2f2')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fca5a5')),
            ('PADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, 1), 2),
        ]))

        story.append(KeepTogether([disclaimer_table]))

        # Build PDF using NumberedCanvas
        doc.build(story, canvasmaker=NumberedCanvas)
        return str(pdf_path)
