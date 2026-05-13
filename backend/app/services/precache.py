import asyncio
from collections import OrderedDict
from app.services.question_gen import generate_question
from app.services.game_state import session_manager

_MAX_CACHE = 500

# Ordered so we can evict oldest entries when the cache grows too large
precache_store: OrderedDict = OrderedDict()

async def precache_neighbors(player_id: str, x: int, y: int):
    """
    Looks at neighboring tiles and pre-generates questions for them.
    Runs as a background task.
    """
    session = session_manager.get(player_id)
    if not session:
        return
    # Look at 3x3 grid around player
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            nx, ny = x + dx, y + dy
            concept = session.graph.get_concept_at(nx, ny)
            
            if concept:
                key = concept["key"]
                cache_id = (player_id, key)
                
                # Only generate if not already in cache
                if cache_id not in precache_store:
                    try:
                        q = await generate_question(concept)
                        precache_store[cache_id] = q
                        if len(precache_store) > _MAX_CACHE:
                            precache_store.popitem(last=False)
                    except Exception as e:
                        print(f"Precache error for {key}: {e}")

def get_cached_question(player_id: str, concept_key: str):
    """Retrieves a question from cache if available."""
    return precache_store.pop((player_id, concept_key), None)
