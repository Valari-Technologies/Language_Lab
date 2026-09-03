import google.generativeai as genai
import json
from django.conf import settings

def generate_ai_content(topic: str, target_level: str, content_type: str) -> dict:
    """
    Invokes Google Gemini API (gemini-1.5-flash) to generate structured CMS content.
    Returns the parsed JSON response corresponding to the content_type schema.
    """
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured on the server. Please check your backend/.env file.")

    genai.configure(api_key=api_key)

    # Define schema mapping prompts
    schemas = {
        "quiz": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 4,
                    "maxItems": 4
                },
                "correct_option_index": {"type": "integer"},
                "explanation": {"type": "string"}
            },
            "required": ["title", "question", "options", "correct_option_index", "explanation"]
        },
        "roleplay_simulation": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "scenario": {"type": "string"},
                "objectives": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "npcCharacter": {"type": "string"},
                "conversation": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "turn": {"type": "integer"},
                            "speaker": {"type": "string"},
                            "text": {"type": "string"},
                            "prompt": {"type": "string"},
                            "recordingRequired": {"type": "boolean"}
                        }
                    }
                }
            },
            "required": ["title", "scenario", "objectives", "npcCharacter", "conversation"]
        },
        "functional_reading": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "docTitle": {"type": "string"},
                "docCategory": {"type": "string"},
                "passage": {"type": "string"},
                "question": {"type": "string"}
            },
            "required": ["title", "docTitle", "passage", "question"]
        },
        "fill_in_blanks": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question_instruction": {"type": "string"},
                "text_template": {"type": "string"}
            },
            "required": ["title", "question_instruction", "text_template"]
        },
        "full_screen": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "heading": {"type": "string"},
                "body": {"type": "string"},
                "quiz": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string"},
                        "options": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "correct_option_index": {"type": "integer"}
                    },
                    "required": ["question", "options", "correct_option_index"]
                },
                "dialogue_steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "speaker": {"type": "string"},
                            "text": {"type": "string"}
                        },
                        "required": ["speaker", "text"]
                    }
                }
            },
            "required": ["title", "heading", "body"]
        },
        "remedial": {
            "type": "object",
            "properties": {
                "hintText": {"type": "string"},
                "foundationQuestion": {"type": "string"},
                "foundationOptions": {
                    "type": "array"
                },
                "correctAnswerIndex": {"type": "integer"}
            },
            "required": ["hintText", "foundationQuestion", "foundationOptions"]
        },
        "dictation": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"}
            },
            "required": ["title", "question"]
        },
        "sequence_audio": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "items": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 3
                }
            },
            "required": ["title", "question", "items"]
        },
        "quiz_listening": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "minItems": 4,
                    "maxItems": 4
                },
                "correct_option_index": {"type": "integer"},
                "explanation": {"type": "string"}
            },
            "required": ["title", "question", "options", "correct_option_index", "explanation"]
        },
        "roleplay": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "prompt": {"type": "string"},
                "script": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "speaker": {"type": "string"},
                            "text": {"type": "string"}
                        },
                        "required": ["speaker", "text"]
                    }
                }
            },
            "required": ["title", "prompt", "script"]
        },
        "pronunciation": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "word": {"type": "string"},
                "phonetic": {"type": "string"}
            },
            "required": ["title", "word", "phonetic"]
        },
        "reading_passage": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "passage": {"type": "string"},
                "question": {"type": "string"}
            },
            "required": ["title", "passage", "question"]
        },
        "match": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "leftItems": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "rightItems": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["title", "question", "leftItems", "rightItems"]
        },
        "flashcards": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "cards": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "front": {"type": "string"},
                            "back": {"type": "string"}
                        },
                        "required": ["id", "front", "back"]
                    }
                }
            },
            "required": ["title", "cards"]
        },
        "wordsearch": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "words": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "gridSize": {"type": "integer"}
            },
            "required": ["title", "question", "words", "gridSize"]
        },
        "fill_blank": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "text": {"type": "string"}
            },
            "required": ["title", "question", "text"]
        },
        "writing_prompt": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "prompt": {"type": "string"},
                "placeholder": {"type": "string"},
                "minWords": {"type": "integer"}
            },
            "required": ["title", "prompt", "placeholder", "minWords"]
        },
        "sentence_builder": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "sentence": {"type": "string"},
                "words": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["title", "question", "sentence", "words"]
        },
        "grammar_correction": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "incorrectSentence": {"type": "string"},
                "correctedSentence": {"type": "string"}
            },
            "required": ["title", "incorrectSentence", "correctedSentence"]
        },
        "true_false": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "correctAnswer": {"type": "boolean"}
            },
            "required": ["title", "question", "correctAnswer"]
        },
        "drag_drop": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "question": {"type": "string"},
                "pairs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "id": {"type": "string"},
                            "source": {"type": "string"},
                            "target": {"type": "string"}
                        },
                        "required": ["id", "source", "target"]
                    }
                }
            },
            "required": ["title", "question", "pairs"]
        }
    }

    schema = schemas.get(content_type)
    if not schema:
        raise ValueError(f"Unsupported content_type: {content_type}")

    if content_type == "remedial":
        prompt = f"""
        Generate simplified remedial / foundation learning content based on the parent educational topic or question: "{topic}".
        Target difficulty level: "{target_level}".

        The remedial content must be a simplified foundation concept.
        You must output a single valid JSON object matching this schema exactly:
        {json.dumps(schema, indent=2)}

        Guidelines for "foundationOptions":
        1. If the parent question is a matching, drag & drop, or pair-association task, "foundationOptions" must be an array of objects, e.g. [{{"source": "a", "target": "1"}}, {{"source": "b", "target": "2"}}, {{"source": "c", "target": "3"}}].
        2. If the parent question is a Multiple Choice / Quiz, "foundationOptions" must be an array of 4 simple option strings, and you should also include "correctAnswerIndex" (integer between 0 and 3) at the root level of the returned JSON.
        3. For other types (fill in blanks, dictation, dialogue, sentence builder), "foundationOptions" must be a list containing a single correct answer string.

        Do not wrap the JSON output in markdown code blocks like ```json ... ```, just return the raw JSON object string.
        """
    else:
        prompt = f"""
        Generate educational content for the topic "{topic}" targeted at level "{target_level}".
        The content type requested is "{content_type}".
        You must output a single valid JSON object matching this schema exactly:
        {json.dumps(schema, indent=2)}

        Do not wrap the JSON output in markdown code blocks like ```json ... ```, just return the raw JSON object string.
        """

    model_names = ["gemini-1.5-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite"]
    response = None
    last_err = None

    for mname in model_names:
        try:
            model = genai.GenerativeModel(mname)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            if response and response.text:
                break
        except Exception as e:
            err_msg = str(e).lower()
            if "404" in err_msg or "not found" in err_msg or "notfound" in err_msg or "model" in err_msg:
                last_err = e
                continue
            else:
                raise e
    else:
        if last_err:
            raise last_err
        raise Exception("All Gemini models failed to generate content.")

    if not response or not response.text:
        raise Exception("Empty response received from Gemini API.")

    try:
        data = json.loads(response.text)
        return data
    except json.JSONDecodeError:
        # Fallback cleanup for code-block formatting if any
        text_clean = response.text.strip()
        if text_clean.startswith("```json"):
            text_clean = text_clean[7:]
        if text_clean.endswith("```"):
            text_clean = text_clean[:-3]
        try:
            return json.loads(text_clean.strip())
        except json.JSONDecodeError:
            raise Exception(f"Invalid JSON returned from Gemini: {response.text}")
