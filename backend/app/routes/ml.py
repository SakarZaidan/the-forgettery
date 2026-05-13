from fastapi import APIRouter, HTTPException
import numpy as np
from typing import List, Dict, Any
from app.services.game_state import session_manager
from app.models.gp_uncertainty import UncertaintyModel
from app.models.thompson import thompson_recommend
from app.models.profiler import get_profiler

router = APIRouter(prefix="/ml", tags=["ml"])

@router.get("/profile/{player_id}")
async def get_profile(player_id: str):
    """Returns the player's behavioral archetype."""
    s = session_manager.get(player_id)
    if not s:
        raise HTTPException(404, "Session not found")
        
    return get_profiler().predict(s)

@router.get("/halflives/{player_id}")
async def get_halflives(player_id: str):
    """Returns detailed HLR memory states for the dashboard."""
    s = session_manager.get(player_id)
    if not s:
        raise HTTPException(404, "Session not found")
        
    rows = []
    for k, m in s.memory.memories.items():
        if m.n_exposures > 0:
            rows.append({
                "concept_key": k,
                "name": s.graph.concepts[k]["name"],
                "half_life": m.half_life,
                "recall_probability": s.hlr.predict_recall(m),
                "n_correct": m.n_correct,
                "n_incorrect": m.n_incorrect,
                "streak": m.streak,
            })
    
    # Sort by lowest recall probability (most urgent)
    rows.sort(key=lambda r: r["recall_probability"])
    return {"rows": rows}

@router.get("/uncertainty/{player_id}")
async def get_uncertainty(player_id: str):
    """Calculates spatial uncertainty using Gaussian Process Regression."""
    s = session_manager.get(player_id)
    if not s:
        raise HTTPException(404, "Session not found")
        
    g = s.graph
    model = UncertaintyModel()

    # 1. Prepare Training Data
    X_train = []
    y_train = []
    for k, m in s.memory.memories.items():
        if m.n_exposures > 0:
            X_train.append(g.get_features(k))
            y_train.append(m.n_correct / m.n_exposures)

    # 2. Fit and Predict
    if len(X_train) >= 2:
        model.fit(np.array(X_train), np.array(y_train))

    mean, std = model.predict(g.feature_matrix)

    # 3. Format results
    out = []
    for i, k in enumerate(g.keys):
        out.append({
            "concept_key": k,
            "x": g.concepts[k]["grid_x"],
            "y": g.concepts[k]["grid_y"],
            "mean": float(mean[i]),
            "std": float(std[i]),
        })
        
    return {"tiles": out, "n_training": len(X_train)}

@router.get("/compass/{player_id}")
async def get_compass(player_id: str):
    """Recommends a target region using Thompson Sampling."""
    s = session_manager.get(player_id)
    if not s:
        raise HTTPException(404, "Session not found")
        
    g = s.graph
    # Calculate aggregate urgency per category
    categories = set(c["category"] for c in g.all_concepts())
    urgency_map = {}
    for cat in categories:
        keys = [k for k, c in g.concepts.items() if c["category"] == cat]
        urgency_map[cat] = float(max(
            (1.0 - s.hlr.predict_recall(s.memory.get(k))) for k in keys
        ))

    rec = thompson_recommend(s.thompson_alpha, s.thompson_beta, urgency_map)

    # Find a specific target tile in the recommended region
    target_keys = [k for k, c in g.concepts.items() if c["category"] == rec["recommended_region"]]
    target_key = min(target_keys, key=lambda k: s.hlr.predict_recall(s.memory.get(k)))
    target_concept = g.concepts[target_key]
    
    return {
        **rec,
        "target_x": target_concept["grid_x"],
        "target_y": target_concept["grid_y"],
        "target_name": target_concept["name"],
        "reason": "High Urgency" if urgency_map[rec["recommended_region"]] > 0.5 else "Exploration"
    }

@router.get("/decay-history/{player_id}")
async def get_decay_history(player_id: str):
    """Returns the historical aggregate recall trend."""
    s = session_manager.get(player_id)
    if not s:
        raise HTTPException(404, "Session not found")
        
    return {
        "history": [
            {"t": t, "mean_recall": p}
            for t, p in s.recall_history
        ]
    }
