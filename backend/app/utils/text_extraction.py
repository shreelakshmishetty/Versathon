import os
import re
import io
from datetime import datetime
from typing import Optional, List, Tuple
from PIL import Image

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

import pytesseract
from app.config import ALLOWED_EXTENSIONS

# Check environment or default Windows paths for Tesseract
TESSERACT_CMD = os.getenv('TESSERACT_CMD', '')
if not TESSERACT_CMD:
    possible_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        os.path.expanduser(r'~\AppData\Local\Tesseract-OCR\tesseract.exe'),
        os.path.expanduser(r'~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe')
    ]
    for p in possible_paths:
        if os.path.exists(p):
            TESSERACT_CMD = p
            break

if TESSERACT_CMD and os.path.exists(TESSERACT_CMD):
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


def detect_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower().replace('.', '')
    if ext in {'pdf'}:
        return 'pdf'
    if ext in {'png', 'jpg', 'jpeg'}:
        return 'image'
    return 'unknown'


def validate_file(filename: str, file_size_mb: float) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False
    if file_size_mb <= 0 or file_size_mb > 15:
        return False
    return True


def preprocess_image_for_ocr(image: Image.Image) -> Image.Image:
    """Preprocess image using OpenCV for higher OCR accuracy."""
    if not HAS_CV2:
        return image.convert('L')
    try:
        open_cv_image = np.array(image.convert('RGB'))
        gray = cv2.cvtColor(open_cv_image, cv2.COLOR_RGB2GRAY)

        # Scale image up if it's too small
        height, width = gray.shape[:2]
        if width < 1200:
            scale = 1200 / width
            gray = cv2.resize(gray, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_CUBIC)

        # Denoise and adaptive thresholding
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 11
        )
        return Image.fromarray(thresh)
    except Exception:
        return image.convert('L')


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extracts text from PDF:
    1. First tries digital text extraction via PyMuPDF or pdfplumber.
    2. If text is empty or too short (scanned PDF), renders pages to images and runs OCR.
    """
    extracted_text = ""

    # 1. Try PyMuPDF direct text extraction
    if HAS_PYMUPDF:
        try:
            doc = fitz.open(file_path)
            pages_text = []
            for page in doc:
                text = page.get_text()
                if text and text.strip():
                    pages_text.append(text.strip())
            extracted_text = "\n\n".join(pages_text)
        except Exception:
            extracted_text = ""

    # Fallback to pdfplumber if PyMuPDF extracted nothing
    if not extracted_text.strip() and HAS_PDFPLUMBER:
        try:
            with pdfplumber.open(file_path) as pdf:
                pages_text = [p.extract_text() for p in pdf.pages if p.extract_text()]
                extracted_text = "\n\n".join(pages_text)
        except Exception:
            extracted_text = ""

    # 2. If PDF contains no selectable text (scanned PDF), render pages and run OCR
    if len(extracted_text.strip()) < 40:
        ocr_text_parts = []
        if HAS_PYMUPDF:
            try:
                doc = fitz.open(file_path)
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    # Render page to high-res image (2x zoom for clarity)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    processed_img = preprocess_image_for_ocr(img)
                    try:
                        text = pytesseract.image_to_string(processed_img, config='--psm 6')
                        if text and text.strip():
                            ocr_text_parts.append(text.strip())
                    except Exception:
                        pass
                if ocr_text_parts:
                    extracted_text = "\n\n".join(ocr_text_parts)
            except Exception:
                pass

    return extracted_text.strip()


def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image file using OCR with preprocessing."""
    try:
        image = Image.open(file_path)
        processed = preprocess_image_for_ocr(image)
        try:
            text = pytesseract.image_to_string(processed, config='--psm 6')
            if text and text.strip():
                return text.strip()
        except Exception:
            pass
        # Fallback to direct image without OpenCV preprocessing
        try:
            raw_text = pytesseract.image_to_string(image)
            return raw_text.strip()
        except Exception:
            return ""
    except Exception:
        return ""


def extract_report_text(file_type: str, file_path: str) -> str:
    if file_type == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_type == 'image':
        return extract_text_from_image(file_path)
    return ""


def parse_report_date(text: str) -> Optional[str]:
    """Parses dates from report text supporting common global medical date formats."""
    if not text:
        return None

    date_patterns = [
        r'(?:Report Date|Date of Report|Collected Date|Test Date|Sample Date|Date)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(?:Report Date|Date of Report|Collected Date|Test Date|Sample Date|Date)[:\s]+(\d{4}[/-]\d{1,2}[/-]\d{1,2})',
        r'(?:Report Date|Date of Report|Date)[:\s]+([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})',
        r'(?:Report Date|Date of Report|Date)[:\s]+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})',
        r'\b(\d{4}-\d{2}-\d{2})\b',
        r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{4})\b',
    ]

    for pat in date_patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            candidate = match.group(1) if match.groups() else match.group(0)
            candidate = candidate.strip().rstrip(',')
            for fmt in ('%d/%m/%Y', '%d-%m-%Y', '%m/%d/%Y', '%m-%d-%Y', '%Y-%m-%d', '%Y/%m/%d', '%B %d %Y', '%B %d, %Y', '%d %B %Y', '%d %b %Y', '%b %d, %Y'):
                try:
                    return datetime.strptime(candidate, fmt).strftime('%Y-%m-%d')
                except ValueError:
                    continue
    return None


def infer_laboratory_name(text: str) -> Optional[str]:
    """Infers the laboratory or hospital clinic name from header text."""
    if not text:
        return None
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for idx, line in enumerate(lines[:12]):
        if re.search(r'\b(lab|laboratory|diagnostics|pathology|clinic|hospital|healthcare|health care|medicare|diagnostic center|biolabs|center)\b', line, re.IGNORECASE):
            # Clean up line
            cleaned = re.sub(r'^(name|lab|from|at)[:\s]+', '', line, flags=re.I).strip()
            if len(cleaned) > 3 and len(cleaned) < 100:
                return cleaned

    # Fallback to the top prominent line if it looks like a business header
    if lines and len(lines[0]) < 80 and not re.search(r'(patient|name|age|gender|date|phone|id)', lines[0], re.I):
        return lines[0]

    return None
