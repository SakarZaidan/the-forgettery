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

CONCEPT_GEN_PROMPT = """You are a curriculum designer. Generate EXACTLY 144 educational concepts for the topic: "{topic}" to fill a complete 12x12 grid.

Rules:
- EXACTLY 144 concepts total — no more, no less.
- Organize into exactly 6 categories representing a logical learning progression (easy → hard).
- Assign each category to exactly 2 consecutive columns (24 concepts each, rows 0–11).
  • Category 1 (most foundational) → grid_x 0–1
  • Category 2 → grid_x 2–3
  • Category 3 → grid_x 4–5
  • Category 4 → grid_x 6–7
  • Category 5 → grid_x 8–9
  • Category 6 (most advanced) → grid_x 10–11
- Every (grid_x, grid_y) pair must be unique. Cover all 144 positions (x 0–11, y 0–11).
- Use snake_case unique keys prefixed by a short topic abbreviation.
- Names must be concise (≤ 20 chars).
- Difficulty scales with category (category 1 → difficulty 1–2, category 6 → difficulty 4–5).

Return ONLY valid JSON, no markdown, no extra text:
{{
  "subject": "{topic}",
  "grid_size": 12,
  "concepts": [
    {{
      "key": "topic_unique_id",
      "name": "Short Name",
      "category": "category_slug",
      "difficulty": 1,
      "grid_x": 0,
      "grid_y": 0,
      "description": "One-sentence definition."
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
