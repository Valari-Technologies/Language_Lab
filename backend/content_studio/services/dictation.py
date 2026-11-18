"""Dictation cards: the clip(s) a student hears and the correct text they must type.

One place that reads a Dictation card, so the publish check and the package agree on where the text is.
A card keeps its tracks in content.items (each with an audio url and the "Correct text"); an older card may keep
a single audio url and text directly in content.
"""


def is_typing_card(content):
    """Whether the student types the answer (the other mode is a multiple-choice quiz and needs no correct text)."""
    content = content or {}
    mode = content.get("responseType") or ("quiz" if content.get("options") else "text")
    return mode != "quiz"


def dictation_items(content):
    """The card's tracks as a list of dicts: {id, audioUrl, url, text, targetText}; targetText is stripped text."""
    content = content or {}
    raw = content.get("items")
    if not (isinstance(raw, list) and raw):
        raw = [{
            "id": "dict-1",
            "audioUrl": content.get("url") or content.get("audioUrl") or "",
            "text": content.get("text") or content.get("targetText") or "",
        }]
    items = []
    for number, item in enumerate(raw, start=1):
        item = dict(item) if isinstance(item, dict) else {"text": str(item or "")}
        audio = item.get("audioUrl") or item.get("url") or ""
        text = str(item.get("targetText") or item.get("text") or "").strip()
        item.setdefault("id", f"dict-{number}")
        item.update({"audioUrl": audio, "url": audio, "text": text, "targetText": text})
        items.append(item)
    return items


def tracks_without_text(content):
    """The track numbers (1, 2, ...) whose Correct text is empty; none when the card is a quiz-mode card."""
    if not is_typing_card(content):
        return []
    return [number for number, item in enumerate(dictation_items(content), start=1) if not item["targetText"]]


def normalize_dictation_content(content):
    """A copy of a Dictation card's content in the Runtime shape: url (first clip), question and items[].targetText."""
    content = dict(content or {})
    items = dictation_items(content)
    content["items"] = items
    content["url"] = content.get("url") or items[0]["audioUrl"]
    content["question"] = content.get("question") or ""
    return content


def normalize_dictation_elements(elements):
    """The elements of a screen with every Dictation card put into the Runtime shape (other elements untouched)."""
    result = []
    for element in elements or []:
        if isinstance(element, dict) and str(element.get("type") or "").lower() == "dictation":
            element = {**element, "type": "dictation", "content": normalize_dictation_content(element.get("content"))}
        result.append(element)
    return result