import json
from google import genai
from google.genai import types
from pydantic import BaseModel
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

class TagResponse(BaseModel):
    tags: list[str]

def generate_tags(name: str, description: str, flashcards_content: str) -> list[str]:
    if not flashcards_content.strip():
        flashcards_content = "No flashcard content provided."
    
    prompt = f"""
    You are an expert educational content analyzer and tagging assistant. 
    Your goal is to generate metadata for flashcards to improve searchability.

    Analyze the provided flashcard set and generate a list of relevant semantic tags.

    Rules:
    - Return the tags as a JSON object with a single key named: "tags" which would contain a list of tags (strings).
    - The "tags" list must contain between 5 and 15 strings.
    - Tags should be 1-2 words maximum.
    - Tags HAVE to be in lowercase.
    

    Input Data:
    <flashcard_set>
        <name>{name}</name>
        <description>{description}</description>
        <content>
        {flashcards_content}
        </content>
    </flashcard_set>
    """
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=500,
                response_mime_type="application/json",
                response_schema=TagResponse,
                safety_settings=[
                    types.SafetySetting(
                        category='HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold='BLOCK_ONLY_HIGH'
                    ),
                    types.SafetySetting(
                        category='HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold='BLOCK_ONLY_HIGH'
                    )
                ]
            )
        )

        parsed_response: TagResponse = response.parsed

        if parsed_response and parsed_response.tags:
             return [t.lower().strip() for t in parsed_response.tags if t.strip()]
    
        return []

    except Exception as e:
        print(f"ERROR: Gemini failed. Error: {e}")
        return []
