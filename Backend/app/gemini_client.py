import json
import google.generativeai as gemini
from .config import settings

gemini.configure(api_key=settings.GEMINI_API_KEY)
model = gemini.GenerativeModel("gemini-1.5-flash-latest")
print("Gemini client initialized succesfully")

def generate_tags(name: str, description: str, flashcards_content: str) -> list[str]:
    if not flashcards_content.strip():
        flashcards_content = "No flashcard content provided."
    
    prompt = f"""
    Your are a tagging assistant. Analyze the content of the flashcard set and generate relevant, consice tags.

    Rules:
    - Tags HAVE to be in lowercase
    - Generate between 5 and 15 tags
    - Tag should be ideally a single word or two words if necessary
    - Return the tags as a JSON object with a single key named: "tags" which would contain a list of tags (strings)

    Flashcard set content:
    - Name: {name}
    - Description: {description}
    - Flashcard content: {flashcards_content}

    Please generate the tags to the above Flashcard set content according to the rules provided.

    Example output:
    {{
        "tags: ["biology", "cells", "science", "genomes", "genetics"]
    }} 
    """

    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "temperature": 0.3,
            }
        )

        json_response = json.loads(response.text)
        tags = json_response.get("tags", [])

        return [str(tag).lower().strip() for tag in tags if isinstance(tag, str) and tag.strip()]
    
    except json.JSONDecodeError as e:
        print(f"ERROR: Gemini did not return a valid JSON. Response: {response.text}, error: {e}")
        return []
    except Exception as e:
        print(f"ERROR: Gemini failed while generating tags. Error: {e}")
        return []
