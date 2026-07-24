import logging
from django.conf import settings
from content_studio.models import Media, ValidationReport
from content_studio.validation_engine import get_referenced_media_ids_and_urls

logger = logging.getLogger(__name__)


def resolve_absolute_url(url_path, request=None):
    if not url_path:
        return ""
    if url_path.startswith("http://") or url_path.startswith("https://"):
        return url_path
    if request:
        return request.build_absolute_uri(url_path)
    # Fallback to default domain or relative path
    return f"{settings.MEDIA_URL.rstrip('/')}/{url_path.lstrip('/')}"


def build_runtime_payload(experience, request=None):
    """
    Assembles a complete Experience hierarchy (Experience -> Activities -> Screens -> resolved Media)
    into a single structured runtime JSON payload for desktop/Electron app rendering.
    Exclusively for stateless previews: zero publisher logic, zero database writes, zero ZIP operations.
    """
    debug_missing = []
    debug_warnings = []
    
    # 1. Resolve Validation Status
    try:
        latest_report = ValidationReport.objects.filter(experience=experience).latest("validated_at")
        validation_status = latest_report.status
        # Collect warnings from last report if any
        if latest_report.results:
            debug_warnings = [r["message"] for r in latest_report.results if r.get("severity") == "WARNING"]
    except ValidationReport.DoesNotExist:
        validation_status = "NOT_RUN"

    # 2. Assemble Experience Metadata
    from django.utils import timezone
    experience_data = {
        "id": experience.id,
        "title": experience.title,
        "description": experience.description or "",
        "grade": experience.grade.grade_name if experience.grade else "",
        "grade_detail": {
            "id": experience.grade.id,
            "name": experience.grade.grade_name
        } if experience.grade else None,
        "subject": experience.subject,
        "language": experience.language,
        "difficulty": experience.difficulty,
        "estimated_duration": experience.estimated_duration,
        "learning_outcomes": [lo.text for lo in experience.learning_outcomes.all()],
        "learningOutcomes": [lo.text for lo in experience.learning_outcomes.all()],
        "tags": experience.tags or [],
        "thumbnail_url": resolve_absolute_url(experience.thumbnail, request) if experience.thumbnail else "",
        "publishedAt": experience.updated_at.isoformat() if experience.updated_at else timezone.now().isoformat()
    }

    # 3. Assemble Activities (ordered by display_order, excluding is_deleted=True)
    activities_list = []
    activities = experience.activities.all().order_by("display_order")
    
    for act in activities:
        # Assemble Screens (ordered by display_order)
        screens_list = []
        screens = act.screens.all().order_by("display_order")
        
        for scr in screens:
            resolved_media = []
            content = scr.content or {}
            
            referenced_ids, referenced_urls = get_referenced_media_ids_and_urls(content)
            
            # Resolve IDs
            for ref_id in referenced_ids:
                try:
                    media_asset = Media.objects.get(id=ref_id)
                    media_url = resolve_absolute_url(media_asset.file.url if media_asset.file else media_asset.url, request)
                    resolved_media.append({
                        "media_id": ref_id,
                        "type": media_asset.media_type,
                        "url": media_url,
                        "missing": False
                    })
                except Media.DoesNotExist:
                    debug_missing.append({
                        "type": "media_id",
                        "reference": str(ref_id),
                        "screen_id": scr.id,
                        "screen_title": scr.title or "(Untitled)"
                    })
                    resolved_media.append({
                        "media_id": ref_id,
                        "type": "IMAGE",  # Default type on broken reference
                        "url": "",
                        "missing": True
                    })

            # Resolve URLs
            for ref_url in referenced_urls:
                if "/media/" in ref_url:
                    filename = ref_url.split("/")[-1]
                    # Find by exact URL or end of file path name
                    media_asset = Media.objects.filter(url=ref_url).first() or Media.objects.filter(file__endswith=filename).first()
                    if media_asset:
                        media_url = resolve_absolute_url(media_asset.file.url if media_asset.file else media_asset.url, request)
                        resolved_media.append({
                            "media_id": media_asset.id,
                            "type": media_asset.media_type,
                            "url": media_url,
                            "missing": False
                        })
                    else:
                        debug_missing.append({
                            "type": "media_url",
                            "reference": ref_url,
                            "screen_id": scr.id,
                            "screen_title": scr.title or "(Untitled)"
                        })
                        resolved_media.append({
                            "media_id": None,
                            "type": "IMAGE",
                            "url": ref_url,
                            "missing": True
                        })
            
            # Compile elements list with backward compatibility
            elements = content.get("elements", [])
            if not elements:
                elements = []
                if scr.screen_type == 'INFORMATION':
                    elements.append({
                        "id": f"block-{scr.id}-dialogue",
                        "type": "dialogue",
                        "content": {
                            "steps": content.get("steps") or [
                                { "step": 1, "name": "Ben", "text": "Hi! What would you like to order?", "avatarColor": "#0ea5e9", "side": "left" },
                                { "step": 2, "name": "Anna", "text": "I'd like a cup of coffee, please.", "avatarColor": "#ea580c", "side": "right" }
                            ]
                        }
                    })
                elif scr.screen_type == 'IMAGE':
                    elements.append({
                        "id": f"block-{scr.id}-image",
                        "type": "image",
                        "content": {
                            "url": content.get("media_url") or "",
                            "caption": content.get("text") or ""
                        }
                    })
                elif scr.screen_type == 'VIDEO':
                    elements.append({
                        "id": f"block-{scr.id}-video",
                        "type": "video",
                        "content": {
                            "url": content.get("media_url") or ""
                        }
                    })
                elif scr.screen_type == 'SPEAKING':
                    elements.append({
                        "id": f"block-{scr.id}-audio",
                        "type": "audio",
                        "content": {
                            "title": content.get("title") or "Listening Clip",
                            "url": content.get("media_url") or ""
                        }
                    })
                elif scr.screen_type == 'QUIZ':
                    elements.append({
                        "id": f"block-{scr.id}-quiz",
                        "type": "quiz",
                        "content": {
                            "question": content.get("quiz_question") or "",
                            "options": content.get("quiz_options") or ["", "", "", ""],
                            "correctAnswerIndex": content.get("quiz_correct_index") if content.get("quiz_correct_index") is not None else 0
                        }
                    })
                elif scr.screen_type == 'WRITING':
                    elements.append({
                        "id": f"block-{scr.id}-text",
                        "type": "text",
                        "content": {
                            "text": content.get("text") or ""
                        },
                        "styles": {
                            "fontFamily": content.get("font") or "Poppins",
                            "fontSize": f"{content.get('size') or 18}px",
                            "color": content.get("color") or "#334155",
                            "alignment": content.get("alignment") or "Left",
                            "fontWeight": content.get("weight") or "Regular"
                        }
                    })

            # Resolve absolute URLs inside the elements in-place
            import copy
            elements = copy.deepcopy(elements)
            for el in elements:
                el_type = el.get("type", "")
                el_content = el.get("content", {})
                if el_type in ["image", "video", "audio"] and el_content:
                    raw_url = el_content.get("url")
                    if raw_url:
                        # Find matching Media asset to get absolute URL
                        if "/media/" in raw_url:
                            filename = raw_url.split("/")[-1]
                            media_asset = Media.objects.filter(url=raw_url).first() or Media.objects.filter(file__endswith=filename).first()
                        else:
                            media_asset = Media.objects.filter(url=raw_url).first()
                            
                        if media_asset:
                            resolved_url = resolve_absolute_url(media_asset.file.url if media_asset.file else media_asset.url, request)
                        else:
                            resolved_url = resolve_absolute_url(raw_url, request)
                        el_content["url"] = resolved_url
            
            screens_list.append({
                "id": scr.id,
                "title": scr.title or "",
                "screen_type": scr.screen_type,
                "type": scr.screen_type,
                "display_order": scr.display_order,
                "content": content,
                "elements": elements,
                "resolved_media": resolved_media,
                "media": resolved_media
            })

        activities_list.append({
            "id": act.id,
            "title": act.title,
            "description": act.description or "",
            "learning_objective": act.learning_objective or "",
            "skills": [s.name for s in act.skills.all()],
            "estimated_duration": act.estimated_duration,
            "mastery_threshold": act.mastery_threshold,
            "display_order": act.display_order,
            "order": act.display_order,
            "screens": screens_list
        })

    payload = {
        "experience": experience_data,
        "activities": activities_list,
        "debug": {
            "missing_assets": debug_missing,
            "warnings": debug_warnings,
            "runtime_version": "1.0.0",
            "validation_status": validation_status
        }
    }
    
    return payload
