import re
import uuid
from django.core.exceptions import ValidationError

# Size limits in bytes
LIMIT_IMAGE = 10 * 1024 * 1024      # 10MB
LIMIT_AUDIO = 20 * 1024 * 1024     # 20MB
LIMIT_VIDEO = 200 * 1024 * 1024    # 200MB
LIMIT_DOCUMENT = 10 * 1024 * 1024  # 10MB

# Whitelists of extensions
EXT_IMAGES = {"jpg", "jpeg", "png", "gif", "webp", "svg"}
EXT_AUDIO = {"mp3", "wav", "m4a", "ogg"}
EXT_VIDEO = {"mp4", "webm", "mov"}
EXT_DOCUMENTS = {"pdf"}

ALL_ALLOWED_EXTENSIONS = EXT_IMAGES | EXT_AUDIO | EXT_VIDEO | EXT_DOCUMENTS

# Content type mappings/whitelists
MIME_IMAGES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
}
MIME_AUDIO = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave", "audio/mp4", "audio/x-m4a", "audio/ogg", "application/ogg"
}
MIME_VIDEO = {
    "video/mp4", "video/webm", "video/ogg", "video/quicktime"
}
MIME_DOCUMENTS = {
    "application/pdf"
}

ALL_ALLOWED_MIMES = MIME_IMAGES | MIME_AUDIO | MIME_VIDEO | MIME_DOCUMENTS

def get_media_type_from_ext(ext):
    ext = ext.lower().strip(".")
    if ext in EXT_IMAGES:
        return "IMAGE"
    elif ext in EXT_AUDIO:
        return "AUDIO"
    elif ext in EXT_VIDEO:
        return "VIDEO"
    elif ext in EXT_DOCUMENTS:
        return "DOCUMENT"
    return None

def validate_file_security(uploaded_file):
    # 1. Enforce extension check
    filename = uploaded_file.name or ""
    parts = filename.split(".")
    if len(parts) < 2:
        raise ValidationError("File has no extension.")
        
    ext = parts[-1].lower()
    if ext not in ALL_ALLOWED_EXTENSIONS:
        raise ValidationError(f"Extension .{ext} is not allowed.")
        
    media_type = get_media_type_from_ext(ext)
    if not media_type:
        raise ValidationError(f"Failed to resolve media type for .{ext}")

    # 2. Enforce size limit
    file_size = uploaded_file.size
    if media_type == "IMAGE" and file_size > LIMIT_IMAGE:
        raise ValidationError(f"Image file exceeds maximum limit of 10MB.")
    elif media_type == "AUDIO" and file_size > LIMIT_AUDIO:
        raise ValidationError(f"Audio file exceeds maximum limit of 20MB.")
    elif media_type == "VIDEO" and file_size > LIMIT_VIDEO:
        raise ValidationError(f"Video file exceeds maximum limit of 200MB.")
    elif media_type == "DOCUMENT" and file_size > LIMIT_DOCUMENT:
        raise ValidationError(f"Document file exceeds maximum limit of 10MB.")

    # 3. Enforce content-type header check
    content_type = uploaded_file.content_type
    if content_type not in ALL_ALLOWED_MIMES:
        raise ValidationError(f"Content type '{content_type}' is not allowed.")

    # 4. Check magic bytes signature
    # Read the first 2048 bytes
    uploaded_file.seek(0)
    header = uploaded_file.read(2048)
    uploaded_file.seek(0) # reset pointer

    if ext in {"jpg", "jpeg"}:
        if not header.startswith(b"\xff\xd8\xff"):
            raise ValidationError("Invalid JPEG file signature.")
    elif ext == "png":
        if not header.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValidationError("Invalid PNG file signature.")
    elif ext == "gif":
        if not (header.startswith(b"GIF87a") or header.startswith(b"GIF89a")):
            raise ValidationError("Invalid GIF file signature.")
    elif ext == "webp":
        if not (header.startswith(b"RIFF") and b"WEBP" in header[8:12]):
            raise ValidationError("Invalid WEBP file signature.")
    elif ext == "pdf":
        if not header.startswith(b"%PDF-"):
            raise ValidationError("Invalid PDF file signature.")
    elif ext == "ogg":
        if not header.startswith(b"OggS"):
            raise ValidationError("Invalid OGG file signature.")
    elif ext == "webm":
        if not header.startswith(b"\x1a\x45\xdf\xa3"):
            raise ValidationError("Invalid WEBM file signature.")
    elif ext == "mp3":
        is_mp3 = header.startswith(b"ID3") or header.startswith(b"\xff\xfb") or header.startswith(b"\xff\xf3") or header.startswith(b"\xff\xf2")
        if not is_mp3:
            raise ValidationError("Invalid MP3 file signature.")
    elif ext == "wav":
        if not (header.startswith(b"RIFF") and b"WAVE" in header[8:16]):
            raise ValidationError("Invalid WAV file signature.")
    elif ext == "svg":
        # Scan SVG for XSS / scripting
        svg_content = header.decode("utf-8", errors="ignore").lower()
        # Look for <script> tags or html script tags
        if "<script" in svg_content:
            raise ValidationError("SVG contains script tags (potential XSS).")
        # Look for inline javascript: hrefs/srcs
        if "javascript:" in svg_content:
            raise ValidationError("SVG contains inline JavaScript (potential XSS).")
        # Look for inline SVG script/event handlers (e.g. onload=, onerror=, onmouseover=)
        event_handler_pattern = re.compile(r"\bon\w+\s*=")
        if event_handler_pattern.search(svg_content):
            raise ValidationError("SVG contains scripting event handlers (potential XSS).")
            
    # For MP4, MOV, M4A, we check general box structure (ftyp box)
    elif ext in {"mp4", "mov", "m4a"}:
        # ftyp box is typically found in first 32 bytes: e.g. [size][ftyp][major_brand]
        if b"ftyp" not in header[:32] and b"moov" not in header[:64] and b"mdat" not in header[:64]:
            raise ValidationError(f"Invalid {ext.upper()} media box signature.")

    return media_type

def sanitize_and_generate_stored_filename(original_name):
    # Ensure name has extension
    parts = original_name.split(".")
    ext = parts[-1].lower() if len(parts) > 1 else ""
    
    # Generate random UUID-based name for local disk storage
    unique_name = f"{uuid.uuid4().hex}"
    if ext:
        unique_name = f"{unique_name}.{ext}"
        
    return unique_name
