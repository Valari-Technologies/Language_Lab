import json
from .models import Scenario, Activity, Screen, Media

def get_referenced_media_ids_and_urls(content):
    referenced_ids = set()
    referenced_urls = set()
    
    def recurse(val, key=None):
        if isinstance(val, dict):
            for k, v in val.items():
                recurse(v, k)
        elif isinstance(val, list):
            for item in val:
                recurse(item, key)
        elif isinstance(val, int):
            if key and ("media_id" in key.lower() or "image_id" in key.lower() or "audio_id" in key.lower() or "video_id" in key.lower() or key.lower() == "id"):
                referenced_ids.add(val)
        elif isinstance(val, str):
            if val.startswith("http") or "/media/" in val:
                referenced_urls.add(val)
            if key and ("media_id" in key.lower() or "image_id" in key.lower() or "audio_id" in key.lower() or "video_id" in key.lower() or key.lower() == "id"):
                try:
                    referenced_ids.add(int(val))
                except ValueError:
                    pass
                    
    recurse(content)
    return referenced_ids, referenced_urls

# Scenario Rules
def check_scenario_metadata(scenario):
    results = []
    # Title rule
    if not scenario.title or not scenario.title.strip():
        results.append({
            "rule": "scenario_title_required",
            "severity": "ERROR",
            "message": "Scenario is missing a title.",
            "item": f"scenario-{scenario.id}"
        })
    else:
        results.append({
            "rule": "scenario_title_required",
            "severity": "PASSED",
            "message": "Scenario has a valid title.",
            "item": f"scenario-{scenario.id}"
        })
        
    # Grade rule
    if not scenario.grade_id:
        results.append({
            "rule": "scenario_grade_required",
            "severity": "ERROR",
            "message": "Scenario has no grade assigned.",
            "item": f"scenario-{scenario.id}"
        })
    else:
        results.append({
            "rule": "scenario_grade_required",
            "severity": "PASSED",
            "message": "Scenario has a grade assigned.",
            "item": f"scenario-{scenario.id}"
        })
        
    # Thumbnail rule
    if not scenario.thumbnail:
        results.append({
            "rule": "scenario_thumbnail_recommended",
            "severity": "WARNING",
            "message": "Scenario is missing a thumbnail image.",
            "item": f"scenario-{scenario.id}"
        })
    else:
        results.append({
            "rule": "scenario_thumbnail_recommended",
            "severity": "PASSED",
            "message": "Scenario has a thumbnail image.",
            "item": f"scenario-{scenario.id}"
        })
        
    # Learning outcomes rule
    if scenario.learning_outcomes.count() == 0:
        results.append({
            "rule": "scenario_outcomes_recommended",
            "severity": "WARNING",
            "message": "Scenario has no learning outcomes defined.",
            "item": f"scenario-{scenario.id}"
        })
    else:
        results.append({
            "rule": "scenario_outcomes_recommended",
            "severity": "PASSED",
            "message": "Scenario has learning outcomes defined.",
            "item": f"scenario-{scenario.id}"
        })
        
    return results

def check_scenario_has_activities(scenario, activities):
    results = []
    if len(activities) == 0:
        results.append({
            "rule": "scenario_activities_required",
            "severity": "ERROR",
            "message": "Scenario has zero activities. At least one activity is required.",
            "item": f"scenario-{scenario.id}"
        })
    else:
        results.append({
            "rule": "scenario_activities_required",
            "severity": "PASSED",
            "message": f"Scenario contains {len(activities)} activity/activities.",
            "item": f"scenario-{scenario.id}"
        })
    return results

def check_scenario_duration_sanity(scenario, activities):
    results = []
    sum_durations = sum(act.estimated_duration for act in activities)
    if scenario.estimated_duration < sum_durations:
        results.append({
            "rule": "scenario_duration_sanity",
            "severity": "WARNING",
            "message": f"Scenario duration ({scenario.estimated_duration}m) is less than the sum of its activities ({sum_durations}m).",
            "item": f"scenario-{scenario.id}"
        })
    else:
        results.append({
            "rule": "scenario_duration_sanity",
            "severity": "PASSED",
            "message": "Scenario estimated duration matches or exceeds the sum of its activities.",
            "item": f"scenario-{scenario.id}"
        })
    return results


# Activity Rules
def check_activity_has_screens(activity, screens):
    results = []
    if len(screens) == 0:
        results.append({
            "rule": "activity_screens_required",
            "severity": "ERROR",
            "message": f"Activity '{activity.title}' has zero screens. At least one screen is required.",
            "item": f"activity-{activity.id}"
        })
    else:
        results.append({
            "rule": "activity_screens_required",
            "severity": "PASSED",
            "message": f"Activity '{activity.title}' contains {len(screens)} screens.",
            "item": f"activity-{activity.id}"
        })
    return results

def check_activity_duration(activity):
    results = []
    if not activity.estimated_duration or activity.estimated_duration == 0:
        results.append({
            "rule": "activity_duration_recommended",
            "severity": "WARNING",
            "message": f"Activity '{activity.title}' has no estimated duration, or duration is 0.",
            "item": f"activity-{activity.id}"
        })
    else:
        results.append({
            "rule": "activity_duration_recommended",
            "severity": "PASSED",
            "message": f"Activity '{activity.title}' has an estimated duration of {activity.estimated_duration}m.",
            "item": f"activity-{activity.id}"
        })
    return results


# Screen Rules
def check_screen_title(screen):
    results = []
    if not screen.title or not screen.title.strip():
        results.append({
            "rule": "screen_title_recommended",
            "severity": "WARNING",
            "message": f"Screen (ID: {screen.id}) is missing a title.",
            "item": f"screen-{screen.id}"
        })
    else:
        results.append({
            "rule": "screen_title_recommended",
            "severity": "PASSED",
            "message": f"Screen '{screen.title}' has a valid title.",
            "item": f"screen-{screen.id}"
        })
    return results

def check_screen_content_required(screen):
    results = []
    if not screen.content or screen.content == {}:
        results.append({
            "rule": "screen_content_required",
            "severity": "ERROR",
            "message": f"Screen '{screen.title or '(Untitled)'}' has empty content JSON.",
            "item": f"screen-{screen.id}"
        })
    else:
        results.append({
            "rule": "screen_content_required",
            "severity": "PASSED",
            "message": f"Screen '{screen.title or '(Untitled)'}' content JSON is present.",
            "item": f"screen-{screen.id}"
        })
    return results

def check_screen_media_references(screen):
    results = []
    content = screen.content or {}
    
    referenced_ids, referenced_urls = get_referenced_media_ids_and_urls(content)
    broken_references = []
    
    for ref_id in referenced_ids:
        if not Media.objects.filter(id=ref_id).exists():
            broken_references.append(f"Media ID {ref_id}")
            
    for ref_url in referenced_urls:
        if "/media/" in ref_url:
            filename = ref_url.split("/")[-1]
            if not Media.objects.filter(url=ref_url).exists() and not Media.objects.filter(file__endswith=filename).exists():
                broken_references.append(f"Media URL '{filename}'")
                
    if broken_references:
        results.append({
            "rule": "screen_broken_media",
            "severity": "ERROR",
            "message": f"Screen '{screen.title or '(Untitled)'}' references broken media: {', '.join(broken_references)}.",
            "item": f"screen-{screen.id}"
        })
    else:
        results.append({
            "rule": "screen_broken_media",
            "severity": "PASSED",
            "message": f"Screen '{screen.title or '(Untitled)'}' has no broken media references.",
            "item": f"screen-{screen.id}"
        })
        
    return results


# Validation Runner Engine
def run_validation_engine(scenario):
    all_results = []
    
    # 1. Scenario Metadata Checks
    all_results.extend(check_scenario_metadata(scenario))
    
    # 2. Activities & Scoped Validation
    activities = scenario.activities.all()
    all_results.extend(check_scenario_has_activities(scenario, activities))
    
    if len(activities) > 0:
        all_results.extend(check_scenario_duration_sanity(scenario, activities))
        
    for act in activities:
        # Check Activity Metadata
        all_results.extend(check_activity_duration(act))
        
        # Check Screens count
        screens = act.screens.all()
        all_results.extend(check_activity_has_screens(act, screens))
        
        for scr in screens:
            # Check Screen Title
            all_results.extend(check_screen_title(scr))
            # Check Screen content
            all_results.extend(check_screen_content_required(scr))
            # Check broken media
            all_results.extend(check_screen_media_references(scr))
            
    # Compute counts
    total_checks = len(all_results)
    errors_count = sum(1 for r in all_results if r["severity"] == "ERROR")
    warnings_count = sum(1 for r in all_results if r["severity"] == "WARNING")
    passed_count = sum(1 for r in all_results if r["severity"] == "PASSED")
    
    if errors_count > 0:
        overall_status = "FAILED"
    elif warnings_count > 0:
        overall_status = "PASSED_WITH_WARNINGS"
    else:
        overall_status = "PASSED"
        
    report_data = {
        "status": overall_status,
        "counts": {
            "total_checks": total_checks,
            "passed": passed_count,
            "warnings": warnings_count,
            "errors": errors_count
        },
        "results": all_results
    }
    
    return report_data
