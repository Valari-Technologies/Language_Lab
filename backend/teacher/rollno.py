"""A roll number identifies a student inside one class section: it may not repeat there."""
import re

from accounts.names import title_name
from .models import Student


def _grade_key(label):
    match = re.search(r"\d+", str(label or ""))
    return int(match.group(0)) if match else str(label or "").strip().lower()


def _section_key(label):
    """"A", "Section A" and "Class 5-A" are the same section."""
    text = str(label or "").strip().upper()
    if text.startswith("SECTION"):
        text = text[len("SECTION"):].strip()
    if "-" in text:
        text = text.split("-")[-1].strip()
    return text


def _roll_key(roll_no):
    """"1" and "01" are the same roll number; other values compare ignoring case."""
    text = str(roll_no or "").strip()
    return str(int(text)) if text.isdigit() else text.upper()


def roll_position_changed(student, roll_no, grade, section):
    """Whether an edit moves the student to another roll number, grade or section (1 and 01 count as unchanged)."""
    return (_roll_key(roll_no), _grade_key(grade), _section_key(section)) != (
        _roll_key(student.roll_no), _grade_key(student.grade), _section_key(student.section))


def find_roll_conflict(school, grade, section, roll_no, exclude_student_id=None):
    """The other student of this school, grade and section who already has this roll number, or None."""
    key = _roll_key(roll_no)
    if not key or school is None:
        return None
    grade_key, section_key = _grade_key(grade), _section_key(section)
    others = Student.objects.filter(school=school).select_related("user")
    if exclude_student_id:
        others = others.exclude(student_id=exclude_student_id)
    for other in others:
        if (_roll_key(other.roll_no) == key and _grade_key(other.grade) == grade_key
                and _section_key(other.section) == section_key):
            return other
    return None


def roll_conflict_message(other, roll_no, grade, section):
    name = title_name(other.user.full_name) or other.user.username
    return f"Roll no {str(roll_no).strip()} is already used by {name} in {grade} Section {_section_key(section) or '-'}."
