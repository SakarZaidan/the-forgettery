from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import json
from pathlib import Path
from app.services.game_state import session_manager
from app.services.concept_graph import ConceptGraph
from app.services.question_gen import generate_question, generate_curriculum
from app.services.precache import precache_neighbors, get_cached_question

_PRESETS_DIR = Path(__file__).parent.parent / "data" / "concepts"

router = APIRouter(prefix="/game", tags=["game"])

class StartReq(BaseModel):
    topic: str

class StartResp(BaseModel):
    player_id: str
    grid_size: int
    subject: str
    spawn_x: int
    spawn_y: int

class AnswerReq(BaseModel):
    player_id: str
    concept_key: str
    correct: bool
    response_time_ms: int

class MoveReq(BaseModel):
    player_id: str
    x: int
    y: int

@router.post("/start", response_model=StartResp)
async def start_game(req: StartReq):
    """Generates a custom curriculum and initializes a session."""
    try:
        # 1. Generate full curriculum with Gemini
        curriculum_data = await generate_curriculum(req.topic)

        # 2. Create a fresh graph per session so concurrent games don't collide
        new_graph = ConceptGraph(curriculum_data)

        # 3. Create session
        session = session_manager.create_session(new_graph)

        return StartResp(
            player_id=session.player_id,
            grid_size=new_graph.grid_size,
            subject=new_graph.subject,
            spawn_x=session.player_x,
            spawn_y=session.player_y,
        )
    except Exception as e:
        print(f"Game start error: {e}")
        raise HTTPException(500, f"Neural Sync Failed: {str(e)}")

@router.get("/state/{player_id}")
async def game_state(player_id: str):
    session = session_manager.get(player_id)
    if not session:
        raise HTTPException(404, "Session not found")

    g = session.graph
    session.snapshot_recall()
    probs = session.memory.get_all_recall_probs()

    tiles = []
    for c in g.all_concepts():
        m = session.memory.get(c["key"])
        tiles.append({
            "key": c["key"],
            "name": c["name"],
            "x": c["grid_x"],
            "y": c["grid_y"],
            "category": c["category"],
            "recall_probability": probs[c["key"]],
            "half_life": m.half_life,
            "n_exposures": m.n_exposures,
            "difficulty": c["difficulty"]
        })

    return {
        "player": {"x": session.player_x, "y": session.player_y},
        "tiles": tiles,
        "subject": g.subject,
        "grid_size": g.grid_size
    }

@router.get("/question/{player_id}/{concept_key}")
async def get_question(player_id: str, concept_key: str):
    session = session_manager.get(player_id)
    if not session:
        raise HTTPException(404)
    concept = session.graph.concepts.get(concept_key)
    if not concept:
        raise HTTPException(404)
    cached = get_cached_question(player_id, concept_key)
    if cached:
        return {"concept": concept, "question": cached}
    q = await generate_question(concept)
    return {"concept": concept, "question": q}

@router.post("/answer")
async def submit_answer(req: AnswerReq):
    session = session_manager.get(req.player_id)
    if not session: raise HTTPException(404)
    session.memory.process_answer(req.concept_key, correct=req.correct, response_time=req.response_time_ms / 1000.0)
    cat = session.graph.concepts[req.concept_key]["category"]
    if req.correct: session.thompson_alpha[cat] += 1
    else: session.thompson_beta[cat] += 1
    m = session.memory.get(req.concept_key)
    return {"concept_key": req.concept_key, "updated": {"half_life": m.half_life, "recall_probability": session.hlr.predict_recall(m), "n_correct": m.n_correct, "streak": m.streak}}

@router.post("/start-preset", response_model=StartResp)
async def start_preset_game(preset: str = "competitive_programming"):
    """Initializes a session from a bundled preset curriculum (no Gemini call)."""
    preset_file = _PRESETS_DIR / f"{preset}.json"
    if not preset_file.exists():
        raise HTTPException(404, f"Preset '{preset}' not found")
    try:
        curriculum_data = json.loads(preset_file.read_text())
        new_graph = ConceptGraph(curriculum_data)
        session = session_manager.create_session(new_graph)
        return StartResp(
            player_id=session.player_id,
            grid_size=new_graph.grid_size,
            subject=new_graph.subject,
            spawn_x=session.player_x,
            spawn_y=session.player_y,
        )
    except Exception as e:
        print(f"Preset start error: {e}")
        raise HTTPException(500, f"Preset Load Failed: {str(e)}")

@router.post("/move")
async def move_player(req: MoveReq):
    session = session_manager.get(req.player_id)
    if not session:
        raise HTTPException(404)
    if not (0 <= req.x < session.graph.grid_size and 0 <= req.y < session.graph.grid_size):
        raise HTTPException(400)
    session.player_x, session.player_y = req.x, req.y
    asyncio.create_task(precache_neighbors(req.player_id, req.x, req.y))
    return {"x": session.player_x, "y": session.player_y}
