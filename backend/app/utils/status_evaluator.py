import re
from typing import Optional, Tuple


def parse_numeric_value(val_str: Optional[str]) -> Optional[float]:
    """Extract float number from value string like '12.4', '< 0.5', '140 mg/dL', '4,500'."""
    if not val_str:
        return None
    cleaned = str(val_str).strip().replace(',', '')
    match = re.search(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?', cleaned)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None


def parse_reference_range(range_str: Optional[str]) -> Tuple[Optional[float], Optional[float], Optional[str]]:
    """
    Parses a reference range string into (min_val, max_val, condition_type).
    Returns (min, max, 'range'), (None, max, 'less_than'), (min, None, 'greater_than'), or (None, None, None).
    """
    if not range_str:
        return None, None, None

    cleaned = str(range_str).strip()

    # Match < or <= or 'less than' or 'up to'
    lt_match = re.match(r'^(?:<|<=|less\s+than|up\s+to|upto)\s*([0-9.,]+)', cleaned, re.IGNORECASE)
    if lt_match:
        val = parse_numeric_value(lt_match.group(1))
        return None, val, 'less_than'

    # Match > or >= or 'greater than' or 'more than'
    gt_match = re.match(r'^(?:>|>=|greater\s+than|more\s+than)\s*([0-9.,]+)', cleaned, re.IGNORECASE)
    if gt_match:
        val = parse_numeric_value(gt_match.group(1))
        return val, None, 'greater_than'

    # Match range X - Y, X to Y, X – Y, X ~ Y
    range_match = re.search(r'([0-9.,]+)\s*(?:-|–|—|to|~)\s*([0-9.,]+)', cleaned, re.IGNORECASE)
    if range_match:
        min_v = parse_numeric_value(range_match.group(1))
        max_v = parse_numeric_value(range_match.group(2))
        if min_v is not None and max_v is not None:
            return min_v, max_v, 'range'

    return None, None, None


def evaluate_test_status(value_str: Optional[str], range_str: Optional[str], ai_status: Optional[str] = None) -> str:
    """
    Evaluates whether value is within_range, below_range, above_range, or unknown.
    If AI provided a recognized valid status and range is ambiguous, AI status is respected.
    Otherwise, mathematical calculation is performed.
    """
    num_val = parse_numeric_value(value_str)
    min_v, max_v, cond_type = parse_reference_range(range_str)

    if num_val is not None:
        if cond_type == 'range' and min_v is not None and max_v is not None:
            if num_val < min_v:
                return 'below_range'
            elif num_val > max_v:
                return 'above_range'
            else:
                return 'within_range'
        elif cond_type == 'less_than' and max_v is not None:
            if num_val <= max_v:
                return 'within_range'
            else:
                return 'above_range'
        elif cond_type == 'greater_than' and min_v is not None:
            if num_val >= min_v:
                return 'within_range'
            else:
                return 'below_range'

    # Fallback to AI status if valid
    if ai_status:
        normalized_ai = str(ai_status).strip().lower().replace(' ', '_')
        if normalized_ai in {'within_range', 'below_range', 'above_range', 'unknown'}:
            return normalized_ai
        if 'within' in normalized_ai:
            return 'within_range'
        if 'below' in normalized_ai or 'low' in normalized_ai:
            return 'below_range'
        if 'above' in normalized_ai or 'high' in normalized_ai:
            return 'above_range'

    return 'unknown'


def get_status_label(status: str) -> str:
    """Returns the user-facing neutral status text."""
    mapping = {
        'within_range': 'Within reported range',
        'below_range': 'Below reference range',
        'above_range': 'Above reference range',
        'unknown': 'Unable to determine',
    }
    return mapping.get(status, 'Unable to determine')


def get_neutral_explanation(test_name: str, value_str: Optional[str], unit: Optional[str], status: str, ref_range: Optional[str]) -> str:
    """Provides neutral educational context for a test result."""
    unit_str = f" {unit}" if unit else ""
    val_disp = f"{value_str}{unit_str}" if value_str else "the reported value"
    ref_disp = f" (reference range: {ref_range})" if ref_range else ""

    if status == 'within_range':
        return f"{test_name} value of {val_disp} is within the reference range shown on this report{ref_disp}."
    elif status == 'below_range':
        return f"{test_name} value of {val_disp} is below the reference range shown on this report{ref_disp}. Discuss this with a qualified healthcare professional."
    elif status == 'above_range':
        return f"{test_name} value of {val_disp} is above the reference range shown on this report{ref_disp}. Discuss this with a qualified healthcare professional."
    else:
        return f"{test_name} value is {val_disp}. A specific reference range comparison was not determined from the report."
