"""A roll number identifies a student inside one class section: it may not repeat there."""
import re

from django.db.models import Q

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


def _class_section_letter(class_name):
    """"Class 5-A" -> "A"; "" when the class name has no section letter (such a class covers its whole grade)."""
    name = str(class_name or "").strip().upper()
    if "-" in name:
        name = name.split("-")[-1].strip()
    if len(name) == 1 and name.isalpha():
        return name
    if len(name) > 1 and name[-1].isalpha() and not name[-2].isalpha():
        return name[-1]
    return ""


def has_teacher_for(school, grade, section):
    """Whether an active teacher of this school is assigned to an active class of this grade and section."""
    from school_admin.models import TeacherClass
    grade_key, section_key = _grade_key(grade), _section_key(section)
    assigned = TeacherClass.objects.filter(
        class_obj__school=school, class_obj__is_active=True, teacher__user__is_active=True,
    ).select_related("class_obj__grade")
    for link in assigned:
        klass = link.class_obj
        if not klass.grade_id or _grade_key(klass.grade.grade_name) != grade_key:
            continue
        letter = _class_section_letter(klass.class_name)
        if not letter or not section_key or letter == section_key:
            return True
    return False


def class_position_changed(student, grade, section):
    """Whether an edit moves the student to another grade or section."""
    return (_grade_key(grade), _section_key(section)) != (_grade_key(student.grade), _section_key(student.section))


def no_teacher_message(grade, section):
    return (f"No teacher is assigned to {grade} Section {_section_key(section) or '-'}. "
            "Go create a teacher for this grade and section.")


def lms_grade_tag(grade):
    """"G5_" for Class 5 / Grade 5, the grade part of a generated login code (VIN_G5_01); empty when there is no number."""
    key = _grade_key(grade)
    return f"G{key}_" if isinstance(key, int) else ""


def lms_code_taken(school, code, exclude_student_id=None):
    """Whether a student of this school (other than exclude_student_id) already has this login code (any letter case)."""
    others = Student.objects.filter(school=school)
    if exclude_student_id:
        others = others.exclude(student_id=exclude_student_id)
    return others.filter(Q(lms_code__iexact=code) | Q(user__username__iexact=code)).exists()


def name_prefix(full_name):
    """The first three letters of the name, upper case (padded with X; STU when there are none)."""
    letters = "".join(c for c in str(full_name or "") if c.isalpha()).upper()
    return letters[:3].ljust(3, "X") if letters else "STU"


def padded_roll(roll_no):
    text = str(roll_no or "").strip()
    return text.zfill(2) if text.isdigit() and len(text) == 1 else text


def login_code_base(full_name, grade, roll_no):
    """name_Grade_RollNo, e.g. VIN_G5_01."""
    return f"{name_prefix(full_name)}_{lms_grade_tag(grade)}{padded_roll(roll_no) or '01'}"


def is_generated_code(code, full_name, roll_no):
    """Whether this login code is the one the system builds from the name and roll no (any earlier format, with or
    without a grade part or a clash letter); a code typed by hand does not match."""
    rolls = {r for r in (str(roll_no or "").strip(), padded_roll(roll_no)) if r}
    if not rolls:
        return False
    options = "|".join(re.escape(r) for r in rolls)
    return bool(re.fullmatch(rf"{name_prefix(full_name)}_(G\d+_)?({options})(_\d+|[B-Z])?", str(code or "").strip(), re.IGNORECASE))


def free_lms_code(school, base, exclude_student_id=None):
    """The generated login code, e.g. VIN_G5_11. When another student of the school already has it (same first letters,
    grade and roll number in another section), a letter is added: VIN_G5_11B, VIN_G5_11C ..."""
    if not lms_code_taken(school, base, exclude_student_id):
        return base
    for suffix in [*"BCDEFGHIJKLMNOPQRSTUVWXYZ", *map(str, range(2, 100))]:
        if not lms_code_taken(school, f"{base}{suffix}", exclude_student_id):
            return f"{base}{suffix}"
    return base  # unreachable in practice; the caller's own clash check then reports it


def roll_conflict_message(other, roll_no, grade, section):
    name = title_name(other.user.full_name) or other.user.username
    return f"Roll no {str(roll_no).strip()} is already used by {name} in {grade} Section {_section_key(section) or '-'}."
