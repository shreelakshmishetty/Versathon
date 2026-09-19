from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Report(Base):
    __tablename__ = 'reports'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)
    file_path = Column(String(500), nullable=False)
    report_date = Column(Date, nullable=True)
    laboratory_name = Column(String(255), nullable=True)
    extracted_text = Column(Text, nullable=True)
    processing_status = Column(String(50), nullable=False, default='completed')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship('User', back_populates='reports')
    tests = relationship('TestResult', back_populates='report', cascade='all, delete-orphan')
    report_meta = relationship('ReportMetadata', back_populates='report', cascade='all, delete-orphan', uselist=False)


class TestResult(Base):
    __tablename__ = 'test_results'

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False)
    test_name = Column(String(255), nullable=False)
    value = Column(String(255), nullable=True)
    unit = Column(String(100), nullable=True)
    reference_range = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False, default='unknown')  # within_range, below_range, above_range, unknown
    explanation = Column(Text, nullable=True)
    important_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship('Report', back_populates='tests')


class ReportMetadata(Base):
    __tablename__ = 'report_metadata'

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False)
    laboratory_name = Column(String(255), nullable=True)
    raw_ocr_text = Column(Text, nullable=True)
    report_summary = Column(Text, nullable=True)
    general_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship('Report', back_populates='report_meta')


class Comparison(Base):
    __tablename__ = 'comparisons'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    old_report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False)
    new_report_id = Column(Integer, ForeignKey('reports.id', ondelete='CASCADE'), nullable=False)
    comparison_data = Column(Text, nullable=True)  # JSON-encoded comparison breakdown
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship('User', back_populates='comparisons')
