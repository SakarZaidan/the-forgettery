import asyncio
from typing import Dict
from app.services.question_gen import generate_question
from app.services.game_state import session_manager
from app.services.concept_graph import global_graph as graph

# Simple in-memory cache for pre-generated questions
# Format: {(player_id, concept_key): question_dict}
precache_store = {}

async def precache_neighbors(player_id: str, x: int, y: int):
    """
    Looks at neighboring tiles and pre-generates questions for them.
    Runs as a background task.
    """
    # Look at 3x3 grid around player
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            nx, ny = x + dx, y + dy
            concept = graph.get_concept_at(nx, ny)
            
            if concept:
                key = concept["key"]
                cache_id = (player_id, key)
                
                # Only generate if not already in cache
                if cache_id not in precache_store:
                    try:
                        q = await generate_question(concept)
                        precache_store[cache_id] = q
                    except Exception as e:
                        print(f"Precache error for {key}: {e}")

def get_cached_question(player_id: str, concept_key: str):
    """Retrieves a question from cache if available."""
    return precache_store.pop((player_id, concept_key), None)
