from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class TestResultSchema(BaseModel):
    test_name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    explanation: Optional[str] = None


class ReportCreateResponse(BaseModel):
    id: int
    user_id: int
    original_filename: str
    file_type: str
    processing_status: str
    extracted_text: Optional[str] = None
    report_date: Optional[date] = None
    tests: list[TestResultSchema] = []
    summary: Optional[str] = None


class ReportSummary(BaseModel):
    report_id: int
    report_date: Optional[date]
    test_count: int
    tests: list[TestResultSchema] = []


class ComparisonData(BaseModel):
    old_report_id: int
    new_report_id: int
    comparisons: list[dict] = []
