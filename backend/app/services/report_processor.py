import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple, Optional

from app.config import UPLOAD_DIRECTORY, GENERATED_REPORTS_DIRECTORY
from app.services.ai_service import AIService
from app.services.pdf_generator import PDFReportGenerator
from app.utils.text_extraction import (
    detect_file_type,
    extract_report_text,
    infer_laboratory_name,
    parse_report_date
)
from app.utils.status_evaluator import evaluate_test_status


class ReportProcessor:
    def __init__(self, storage_root: str = UPLOAD_DIRECTORY):
        self.storage_root = Path(storage_root)
        self.storage_root.mkdir(parents=True, exist_ok=True)
        self.ai_service = AIService()
        self.pdf_generator = PDFReportGenerator(GENERATED_REPORTS_DIRECTORY)

    def save_upload(self, file, user_id: int) -> Tuple[str, str, str]:
        """Saves uploaded file securely into user-scoped directory."""
        original_name = file.filename or "report.pdf"
        file_type = detect_file_type(original_name)
        safe_name = re.sub(r'[^A-Za-z0-9_.-]', '_', original_name)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        final_filename = f"{timestamp}_{safe_name}"

        folder = self.storage_root / str(user_id)
        folder.mkdir(parents=True, exist_ok=True)
        destination = folder / final_filename

        with open(destination, 'wb') as f:
            f.write(file.file.read())

        return str(destination), file_type, original_name

    def process_report(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Extracts text, runs heuristics, and executes AI report analysis.
        """
        extracted_text = extract_report_text(file_type, file_path)
        heuristic_date = parse_report_date(extracted_text)
        heuristic_lab = infer_laboratory_name(extracted_text)
        heuristic_tests = self.extract_heuristic_test_results(extracted_text)

        # Call AI service for deep understanding
        if file_type == 'image':
            ai_data = self.ai_service.analyze_report_image(file_path, extracted_text)
        else:
            ai_data = self.ai_service.analyze_report_text(extracted_text, heuristic_tests)

        # Merge date and laboratory name preferring AI extraction if confident, else heuristic
        final_date = ai_data.get("report_date") or heuristic_date
        if final_date:
            # Standardize date format YYYY-MM-DD
            parsed_d = parse_report_date(final_date)
            if parsed_d:
                final_date = parsed_d

        final_lab = ai_data.get("laboratory_name") or heuristic_lab

        # Combine AI tests with heuristic tests if AI found none
        tests = ai_data.get("tests", [])
        if not tests and heuristic_tests:
            for ht in heuristic_tests:
                st = evaluate_test_status(ht.get("value"), ht.get("reference_range"))
                tests.append({
                    "test_name": ht.get("test_name"),
                    "value": ht.get("value"),
                    "unit": ht.get("unit"),
                    "reference_range": ht.get("reference_range") or "Not provided",
                    "status": st,
                    "simple_explanation": f"{ht.get('test_name')} is a measured laboratory parameter.",
                    "important_note": "Review this test value with your doctor."
                })

        return {
            "extracted_text": extracted_text,
            "report_date": final_date,
            "laboratory_name": final_lab,
            "report_summary": ai_data.get("report_summary", ""),
            "general_notes": ai_data.get("general_notes", []),
            "tests": tests
        }

    def extract_heuristic_test_results(self, text: str) -> List[Dict[str, Any]]:
        """Parses tabular and line-by-line lab report formats."""
        if not text:
            return []

        results = []
        lines = [line.strip() for line in text.splitlines() if line.strip()]

        for line in lines:
            # Skip obvious header/footer noise
            if re.search(r'^(patient|page|date|doctor|hospital|phone|dr\.|mr\.|mrs\.|ms\.)', line, re.IGNORECASE):
                continue

            # Pipe-separated table format (e.g. "Hemoglobin | 13.5 | g/dL | 12.0 - 16.0")
            if '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 3 and len(parts[0]) > 2:
                    results.append({
                        'test_name': parts[0],
                        'value': parts[1],
                        'unit': parts[2] if len(parts) > 2 else '',
                        'reference_range': parts[3] if len(parts) > 3 else 'Not provided'
                    })
                continue

            # Regex for "Test Name: Value Unit (Ref Range)" or "Test Name ... Value Unit Ref"
            match = re.search(
                r'^(?P<name>[A-Za-z0-9\s/()\-–\.,]+?)\s*[:\t]\s*(?P<val>[<>]?\s*\d+(?:\.\d+)?)\s*(?P<unit>[A-Za-zµ/%\^0-9]+)?\s*(?:\((?:ref|range|normal)?\s*(?P<ref>[^)]+)\)|(?:ref|range)?\s*[:\t]?\s*(?P<ref2>[0-9\.\s\-–to<>=]+))?',
                line,
                re.IGNORECASE
            )
            if match and len(match.group('name').strip()) >= 3:
                ref_val = match.group('ref') or match.group('ref2') or 'Not provided'
                results.append({
                    'test_name': match.group('name').strip(),
                    'value': match.group('val').strip(),
                    'unit': (match.group('unit') or '').strip(),
                    'reference_range': ref_val.strip()
                })

        return results[:40]

    def generate_pdf_summary(
        self,
        report,
        tests: List[Any],
        user_name: str,
        comparisons: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """Invokes PDF generator service."""
        test_dicts = []
        for t in tests:
            test_dicts.append({
                'test_name': t.test_name,
                'value': t.value,
                'unit': t.unit,
                'reference_range': t.reference_range,
                'status': getattr(t, 'status', 'unknown'),
                'explanation': t.explanation,
                'important_note': getattr(t, 'important_note', '')
            })

        summary_text = ""
        if report.report_meta and report.report_meta.report_summary:
            summary_text = report.report_meta.report_summary

        date_str = report.report_date.strftime('%Y-%m-%d') if report.report_date else None
        lab_name = report.laboratory_name or (report.report_meta.laboratory_name if report.report_meta else None)

        return self.pdf_generator.generate_summary_pdf(
            report_id=report.id,
            user_name=user_name,
            original_filename=report.original_filename,
            report_date=date_str,
            laboratory_name=lab_name,
            summary_text=summary_text,
            tests=test_dicts,
            comparisons=comparisons
        )
