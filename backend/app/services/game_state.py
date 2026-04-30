from time import time
from typing import Dict, List, Optional, Tuple
from uuid import uuid4
from app.models.hlr import HalfLifeRegression, GameMemoryStore
from app.services.concept_graph import ConceptGraph
from app.config import settings


class GameSession:
    """Represents a single player's game session."""
    
    def __init__(self, player_id: str, concept_graph: ConceptGraph):
        self.player_id = player_id
        self.graph = concept_graph
        self.hlr = HalfLifeRegression(initial_half_life=settings.initial_half_life)
        self.memory = GameMemoryStore(
            concept_keys=[c["key"] for c in concept_graph.all_concepts()],
            hlr=self.hlr,
        )
        
        # Spawn player at the first 'basics' tile (deterministic start)
        basics = [c for c in concept_graph.all_concepts() if c["category"] == "basics"]
        first = basics[0] if basics else concept_graph.all_concepts()[0]
        self.player_x = first["grid_x"]
        self.player_y = first["grid_y"]
        
        self.created_at = time()
        self.recall_history: List[Tuple[float, float]] = []  # [(timestamp, mean_recall)]
        
        # Track Beta posteriors for Thompson Sampling per category
        cats = set(c["category"] for c in concept_graph.all_concepts())
        self.thompson_alpha = {c: 1.0 for c in cats}
        self.thompson_beta = {c: 1.0 for c in cats}

    def snapshot_recall(self):
        """Takes a snapshot of the aggregate recall probability for the dashboard."""
        probs = self.memory.get_all_recall_probs()
        mean_p = sum(probs.values()) / len(probs)
        self.recall_history.append((time(), mean_p))
        
        # Keep only the last 10 minutes of history (600 seconds)
        cutoff = time() - 600
        self.recall_history = [(t, p) for t, p in self.recall_history if t > cutoff]


class SessionManager:
    """Manages active game sessions in memory."""
    
    def __init__(self):
        self.sessions: Dict[str, GameSession] = {}

    def create_session(self, concept_graph: ConceptGraph) -> GameSession:
        pid = str(uuid4())
        session = GameSession(pid, concept_graph)
        self.sessions[pid] = session
        return session

    def get(self, player_id: str) -> Optional[GameSession]:
        return self.sessions.get(player_id)

    def cleanup_old_sessions(self, max_age_seconds: int = 3600):
        """Removes sessions that haven't been touched for a while."""
        now = time()
        to_remove = [
            pid for pid, s in self.sessions.items() 
            if now - s.created_at > max_age_seconds
        ]
        for pid in to_remove:
            del self.sessions[pid]


# Singleton instance
session_manager = SessionManager()
