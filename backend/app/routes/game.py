from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
from app.services.game_state import session_manager
from app.services.concept_graph import global_graph as graph
from app.services.question_gen import generate_question, generate_curriculum
from app.services.precache import precache_neighbors, get_cached_question

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
        
        # 2. Populate the global graph
        graph.load_data(curriculum_data)
        
        # 3. Create session
        session = session_manager.create_session(graph)
        
        return StartResp(
            player_id=session.player_id,
            grid_size=graph.grid_size,
            subject=graph.subject,
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
    
    session.snapshot_recall()
    probs = session.memory.get_all_recall_probs()
    
    tiles = []
    for c in graph.all_concepts():
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
        "subject": graph.subject,
        "grid_size": graph.grid_size
    }

@router.get("/question/{player_id}/{concept_key}")
async def get_question(player_id: str, concept_key: str):
    cached = get_cached_question(player_id, concept_key)
    if cached:
        concept = graph.concepts.get(concept_key)
        return {"concept": concept, "question": cached}

    session = session_manager.get(player_id)
    if not session: raise HTTPException(404)
    concept = graph.concepts.get(concept_key)
    if not concept: raise HTTPException(404)
    q = await generate_question(concept)
    return {"concept": concept, "question": q}

@router.post("/answer")
async def submit_answer(req: AnswerReq):
    session = session_manager.get(req.player_id)
    if not session: raise HTTPException(404)
    session.memory.process_answer(req.concept_key, correct=req.correct, response_time=req.response_time_ms / 1000.0)
    cat = graph.concepts[req.concept_key]["category"]
    if req.correct: session.thompson_alpha[cat] += 1
    else: session.thompson_beta[cat] += 1
    m = session.memory.get(req.concept_key)
    return {"concept_key": req.concept_key, "updated": {"half_life": m.half_life, "recall_probability": session.hlr.predict_recall(m), "n_correct": m.n_correct, "streak": m.streak}}

@router.post("/move")
async def move_player(req: MoveReq):
    session = session_manager.get(req.player_id)
    if not session: raise HTTPException(404)
    if not (0 <= req.x < graph.grid_size and 0 <= req.y < graph.grid_size): raise HTTPException(400)
    session.player_x, session.player_y = req.x, req.y
    asyncio.create_task(precache_neighbors(req.player_id, req.x, req.y))
    return {"x": session.player_x, "y": session.player_y}
