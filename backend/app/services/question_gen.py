import httpx
import json
import re
import asyncio
from typing import Dict, Optional, List
from app.config import settings

# Structured prompt for consistent JSON output
QUESTION_PROMPT = """Generate ONE professional multiple-choice quiz question about: "{concept_name}"
Context/Description: {description}
Target Difficulty: {difficulty}/5

Rules:
1. Return ONLY valid JSON.
2. No conversational text, no markdown code blocks.
3. Provide 4 distinct choices.

Schema:
{{
  "question": "The actual question text",
  "choices": ["A) Choice 1", "B) Choice 2", "C) Choice 3", "D) Choice 4"],
  "correct_index": 0,
  "explanation": "Brief explanation of why the answer is correct"
}}
"""

CONCEPT_GEN_PROMPT = """You are a curriculum designer. Generate exactly 30 educational concepts for the topic: "{topic}".
Organize them into 5 categories that represent a logical progression.
Map each concept to a 12x12 grid (grid_x and grid_y from 0 to 11).
Space the categories into distinct grid clusters.

Return ONLY valid JSON with this schema:
{{
  "subject": "{topic}",
  "grid_size": 12,
  "concepts": [
    {{ 
      "key": "unique_id", 
      "name": "Display Name", 
      "category": "cat_name", 
      "difficulty": 1-5, 
      "grid_x": 0-11, 
      "grid_y": 0-11, 
      "description": "Short definition" 
    }}
  ]
}}
"""

def _extract_json(text: str) -> Optional[Dict]:
    """Surgically extracts JSON from LLM output."""
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None

async def generate_with_gemini(prompt: str) -> Optional[Dict]:
    """Core Gemini generation logic."""
    if not settings.gemini_api_key:
        raise Exception("GEMINI_API_KEY not configured")
        
    import google.generativeai as genai
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(settings.gemini_model)
    
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        return _extract_json(response.text)
    except Exception as e:
        print(f"[Gemini] Error: {e}")
        return None

async def generate_curriculum(topic: str) -> Dict:
    """Generates a full curriculum grid for a topic."""
    prompt = CONCEPT_GEN_PROMPT.format(topic=topic)
    result = await generate_with_gemini(prompt)
    if not result:
        raise Exception("Failed to generate curriculum from Gemini")
    return result

async def generate_question(concept: Dict) -> Dict:
    """Generates a MCQ for a specific concept."""
    prompt = QUESTION_PROMPT.format(
        concept_name=concept["name"],
        description=concept.get("description", ""),
        difficulty=concept.get("difficulty", 1),
    )
    
    result = await generate_with_gemini(prompt)
    if result:
        return result
        
    # Hardcoded fallback
    return {
        "question": f"Which best describes '{concept['name']}'?",
        "choices": [f"A) {concept.get('description', 'Option A')}", "B) Choice B", "C) Choice C", "D) Choice D"],
        "correct_index": 0,
        "explanation": f"Concept explanation for {concept['name']}."
    }
