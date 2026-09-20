import json
import logging
import base64
import mimetypes
from typing import List, Dict, Any, Optional
import requests

from app.config import AI_API_KEY, AI_BASE_URL, AI_MODEL
from app.utils.status_evaluator import evaluate_test_status, get_neutral_explanation

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are H2, an AI Medical Report Explanation Assistant.
Your mission is to help patients understand their laboratory and medical test reports in clear, simple, and reassuring educational language.

CRITICAL SAFETY & MEDICAL RULES:
1. You are an information-understanding tool, NOT a diagnostic system.
2. NEVER diagnose diseases or conditions (e.g. do not say "You have diabetes" or "You suffer from anemia").
3. NEVER prescribe medications or recommend changing medication/dosages.
4. NEVER invent or hallucinate test names, values, or reference ranges. If any field is missing or not legible, use "Not provided" or "Not detected".
5. Use neutral, objective, and non-alarmist language at all times.
6. For each test, provide:
   - test_name: exact clean test name from report
   - value: numerical or categorical value as reported
   - unit: original unit (e.g., mg/dL, g/dL, /uL, %, mmol/L)
   - reference_range: exact reference interval printed on the report, or "Not provided" if absent
   - status: one of "within_range", "below_range", "above_range", or "unknown"
   - simple_explanation: a 1-2 sentence easy-to-understand explanation of what this test measures in the body
   - important_note: neutral factual observation about the value relative to the printed range, advising discussion with a healthcare provider if outside range
7. Return strictly valid JSON with no markdown wrapping.
"""

EXPECTED_JSON_SCHEMA = """
{
  "report_summary": "A 2-4 sentence high-level overview explaining what types of tests are present in this report in simple language.",
  "report_date": "YYYY-MM-DD or Not detected",
  "laboratory_name": "Laboratory/Hospital name or Not detected",
  "tests": [
    {
      "test_name": "Hemoglobin",
      "value": "12.4",
      "unit": "g/dL",
      "reference_range": "12.0 - 16.0",
      "status": "within_range",
      "simple_explanation": "Hemoglobin is an iron-rich protein in red blood cells that carries oxygen throughout your body.",
      "important_note": "Your value is within the reference range shown on this report."
    }
  ],
  "general_notes": [
    "This report explanation is for educational purposes only and does not replace medical consultation."
  ]
}
"""


class AIService:
    def __init__(self):
        self.api_key = AI_API_KEY.strip() if AI_API_KEY and AI_API_KEY != 'your_api_key_here' and AI_API_KEY != 'your_actual_api_key_here' else ''
        self.base_url = AI_BASE_URL.rstrip('/')
        self.model = AI_MODEL

    def analyze_report_text(self, extracted_text: str, pre_extracted_tests: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Analyzes extracted report text with OpenAI API.
        Returns structured JSON containing report summary, tests, and metadata.
        """
        if not self.api_key or not extracted_text.strip():
            logger.warning("No OpenAI API key found or empty text; executing fallback heuristic analysis.")
            return self._heuristic_fallback_analysis(extracted_text, pre_extracted_tests or [])

        prompt = f"""Please analyze the following extracted medical report text and return the structured JSON analysis according to the schema.

EXTRACTED REPORT TEXT:
\"\"\"
{extracted_text}
\"\"\"

JSON SCHEMA EXAMPLE:
{EXPECTED_JSON_SCHEMA}
"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            data = response.json()
            raw_content = data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_content)
            return self._normalize_ai_response(parsed, extracted_text)
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}. Falling back to heuristic analysis.")
            return self._heuristic_fallback_analysis(extracted_text, pre_extracted_tests or [])

    def analyze_report_image(
        self,
        image_path: str,
        ocr_text: str = "",
        pre_extracted_tests: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Uses OpenAI Vision API to extract and explain medical report directly from an image.
        """
        if not self.api_key:
            return self._heuristic_fallback_analysis(ocr_text, pre_extracted_tests or [])

        try:
            mime_type = mimetypes.guess_type(image_path)[0] or "image/jpeg"
            with open(image_path, "rb") as img_file:
                encoded_image = base64.b64encode(img_file.read()).decode("ascii")

            prompt = f"""Examine this medical report image carefully.
OCR Context (if any):
\"\"\"
{ocr_text}
\"\"\"

Extract all test results, lab name, report date, and provide simple educational explanations following this JSON format:
{EXPECTED_JSON_SCHEMA}
"""

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.model if "gpt-4" in self.model else "gpt-4o-mini",
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{encoded_image}",
                                    "detail": "high"
                                }
                            }
                        ]
                    }
                ],
                "temperature": 0.2
            }

            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=90
            )
            response.raise_for_status()
            data = response.json()
            raw_content = data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_content)
            return self._normalize_ai_response(parsed, ocr_text)
        except Exception as e:
            logger.error(f"OpenAI Vision call failed: {e}. Falling back to OCR analysis.")
            return self._heuristic_fallback_analysis(ocr_text, pre_extracted_tests or [])

    def _normalize_ai_response(self, ai_data: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
        """Validates and standardizes AI response, ensuring mathematically sound statuses."""
        tests_list = []
        raw_tests = ai_data.get("tests", [])

        for t in raw_tests:
            name = str(t.get("test_name", "Laboratory Test")).strip()
            val = str(t.get("value", "")).strip() if t.get("value") is not None else "Not detected"
            unit = str(t.get("unit", "")).strip() if t.get("unit") is not None else ""
            ref = str(t.get("reference_range", "")).strip() if t.get("reference_range") is not None else "Not provided"
            
            # Re-evaluate status to guarantee mathematical consistency
            status = evaluate_test_status(val, ref, t.get("status"))
            
            expl = t.get("simple_explanation")
            if not expl or expl == "None":
                expl = get_neutral_explanation(name, val, unit, status, ref)

            note = t.get("important_note")
            if not note or note == "None":
                if status == "below_range":
                    note = "Your reported value is below the reference range shown on this report. Discuss this result with your healthcare provider."
                elif status == "above_range":
                    note = "Your reported value is above the reference range shown on this report. Discuss this result with your healthcare provider."
                elif status == "within_range":
                    note = "Your reported value falls within the standard reference range listed on this report."
                else:
                    note = "Reference range comparison was not determined from the report."

            tests_list.append({
                "test_name": name,
                "value": val,
                "unit": unit,
                "reference_range": ref,
                "status": status,
                "simple_explanation": expl,
                "important_note": note
            })

        summary = ai_data.get("report_summary")
        if not summary:
            summary = f"This report contains {len(tests_list)} extracted laboratory test result(s). Review each value alongside its reference range for clear understanding."

        return {
            "report_summary": summary,
            "report_date": ai_data.get("report_date") or None,
            "laboratory_name": ai_data.get("laboratory_name") or None,
            "tests": tests_list,
            "general_notes": ai_data.get("general_notes", [
                "This report explanation is intended for educational purposes only. Always consult a qualified healthcare professional for medical interpretation."
            ])
        }

    def _heuristic_fallback_analysis(self, extracted_text: str, pre_extracted_tests: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Provides reliable, deterministic fallback analysis when OpenAI API is not available."""
        tests = []
        for item in pre_extracted_tests:
            name = item.get("test_name", "Test")
            val = str(item.get("value", "Not detected"))
            unit = item.get("unit") or ""
            ref = item.get("reference_range") or "Not provided"
            status = evaluate_test_status(val, ref)
            explanation = get_neutral_explanation(name, val, unit, status, ref)
            
            tests.append({
                "test_name": name,
                "value": val,
                "unit": unit,
                "reference_range": ref,
                "status": status,
                "simple_explanation": explanation,
                "important_note": "Educational information based on extracted report data. Please review with your healthcare provider."
            })

        summary = (
            f"This medical report contains {len(tests)} test parameter(s). "
            "Each value has been extracted and organized alongside its reference range for simple reading. "
            "Please consult a healthcare professional for clinical advice."
        ) if tests else "No readable tests could be extracted from this report. Please upload a clear document."

        return {
            "report_summary": summary,
            "report_date": None,
            "laboratory_name": None,
            "tests": tests,
            "general_notes": [
                "This application provides AI-assisted explanations of laboratory reports for informational purposes only.",
                "It does not diagnose medical conditions or prescribe treatments."
            ]
        }
