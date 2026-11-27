import re


def title_name(value):
    """A person's name with a capital at the start of each word: "ravi kumar" / "RAVI KUMAR" -> "Ravi Kumar"."""
    text = re.sub(r"\s+", " ", str(value or "")).strip().lower()
    return re.sub(r"(^|[\s\-])(\w)", lambda m: m.group(1) + m.group(2).upper(), text)
