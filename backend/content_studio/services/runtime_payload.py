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
        "experience_type": experience.experience_type,
        "mastery_threshold": experience.mastery_threshold,
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
                scr_type = (scr.screen_type or "").upper()
                is_multimedia = (
                    content.get("mediaType") == "multimedia"
                    or (content.get("questions") and (content.get("audioUrl") or content.get("videoUrl")))
                    or (content.get("type", "").lower() in ["multimedia_reading_assessment", "multimedia reading assessment", "multimedia_reading", "multimedia"])
                )
                is_quiz = (
                    scr_type in ["QUIZ", "ASSESSMENT"]
                    or bool(content.get("quiz_question"))
                    or (bool(content.get("questions")) and not is_multimedia)
                )

                if is_multimedia:
                    elements.append({
                        "id": f"block-{scr.id}-multimedia",
                        "type": "multimedia_reading_assessment",
                        "slot": "left",
                        "content": {
                            "mediaType": content.get("mediaType", "multimedia"),
                            "audioUrl": content.get("audioUrl", "") or (content.get("media_url") if content.get("media_type") == "AUDIO" else ""),
                            "videoUrl": content.get("videoUrl", "") or (content.get("media_url") if content.get("media_type") == "VIDEO" else ""),
                            "scenario": content.get("scenario", ""),
                            "documentText": content.get("documentText", ""),
                            "questions": content.get("questions", []),
                        }
                    })
                elif is_quiz:
                    q_first = content.get("questions")[0] if (content.get("questions") and isinstance(content.get("questions"), list) and isinstance(content.get("questions")[0], dict)) else {}
                    quiz_q = content.get("quiz_question") or q_first.get("question") or content.get("question") or "Quiz question"
                    quiz_opts = content.get("quiz_options") or q_first.get("options") or content.get("options") or ["", "", "", ""]
                    quiz_corr = content.get("quiz_correct_index") if content.get("quiz_correct_index") is not None else q_first.get("correctAnswerIndex", 0)
                    elements.append({
                        "id": f"block-{scr.id}-quiz",
                        "type": "quiz",
                        "slot": "left",
                        "content": {
                            "question": quiz_q,
                            "options": [{"text": opt} if isinstance(opt, str) else opt for opt in quiz_opts],
                            "correctAnswerIndex": quiz_corr,
                            "questions": content.get("questions") or []
                        }
                    })
                elif scr_type == "IMAGE" or content.get("media_type") == "IMAGE":
                    elements.append({
                        "id": f"block-{scr.id}-image",
                        "type": "image",
                        "slot": "right",
                        "content": {
                            "url": content.get("media_url", ""),
                            "media_id": content.get("media_id", ""),
                            "caption": content.get("text", "") or content.get("caption", ""),
                            "hasQuestion": content.get("hasQuestion", False),
                            "questionText": content.get("questionText", ""),
                            "questionOptions": content.get("questionOptions", []),
                            "correctAnswer": content.get("correctAnswer", "")
                        }
                    })
                elif scr_type == "VIDEO" or content.get("media_type") == "VIDEO":
                    elements.append({
                        "id": f"block-{scr.id}-video",
                        "type": "video",
                        "slot": "right",
                        "content": {
                            "url": content.get("media_url", ""),
                            "media_id": content.get("media_id", "")
                        }
                    })
                elif scr_type == "SPEAKING" or content.get("media_type") == "AUDIO":
                    elements.append({
                        "id": f"block-{scr.id}-audio",
                        "type": "audio",
                        "slot": "right",
                        "content": {
                            "title": content.get("title", "Audio Clip"),
                            "url": content.get("media_url", ""),
                            "media_id": content.get("media_id", "")
                        }
                    })

            # Resolve absolute URLs inside the elements in-place
            import copy
            elements = copy.deepcopy(elements)
            for el in elements:
                raw_type = (el.get("type") or "").lower()
                if raw_type in ["roleplay_simulation", "roleplay simulation", "roleplay", "role_play", "dialogue"]:
                    el["type"] = "roleplay_simulation"
                elif raw_type in ["sentence_builder", "sentence builder"]:
                    el["type"] = "sentence_builder"
                elif raw_type in ["fill_blank", "fill_blanks", "fill_in_blanks"]:
                    el["type"] = "fill_blank"
                elif raw_type in ["audio_mystery", "audio mystery"]:
                    el["type"] = "audio_mystery"
                elif raw_type in ["hotspot_explorer", "hotspot explorer"]:
                    el["type"] = "hotspot_explorer"
                elif raw_type in ["functional_reading", "functional reading"]:
                    el["type"] = "functional_reading"
                elif raw_type in ["multimedia_reading_assessment", "multimedia reading assessment", "multimedia_reading", "multimedia_assessment", "multimedia reading & assessment", "multimedia"]:
                    el["type"] = "multimedia_reading_assessment"
                elif raw_type in ["quiz", "mcq", "assessment", "quiz_assessment", "assessment_quiz", "assessment_question", "multiple_choice", "quiz_listening"]:
                    el["type"] = "quiz"

                el_type = el.get("type", "")
                el_content = el.get("content", {})
                if el_type == "multimedia_reading_assessment" and el_content:
                    for media_key in ["audioUrl", "videoUrl", "posterUrl"]:
                        raw_u = el_content.get(media_key)
                        if raw_u:
                            el_content[media_key] = resolve_absolute_url(raw_u, request)
                if el_type == "roleplay_simulation" and el_content:
                    conv = el_content.get("conversation") or el_content.get("steps") or el_content.get("dialogue_lines") or el_content.get("lines") or el_content.get("turns") or []
                    if conv:
                        el_content["conversation"] = conv
                        el_content["steps"] = conv
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
            "activity_type": act.activity_type,
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
