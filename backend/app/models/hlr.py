"""
Half-Life Regression (Settles & Meeder, 2016)
Predicts the half-life of a concept in a learner's memory.

P(recall) = 2^(-Δt / h)
log2(h) = θ · x

Feature vector x:
  [log1p(n_correct), log1p(n_incorrect), log1p(n_exposures), 
   log1p(avg_response_time), log1p(streak), log1p(last_gap), difficulty]
"""
import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Tuple
from time import time


@dataclass
class ConceptMemory:
    """Represents the memory state of a single concept for a player."""
    key: str
    n_correct: int = 0
    n_incorrect: int = 0
    n_exposures: int = 0
    avg_response_time: float = 5.0
    streak: int = 0
    last_reviewed_at: float = field(default_factory=time)
    last_gap: float = 0.0
    difficulty: float = 1.0
    half_life: float = 120.0 # Default starting half-life in seconds


class HalfLifeRegression:
    """
    Online Half-Life Regression. 
    Uses SGD to update θ that maps memory features to half-life.
    """

    def __init__(
        self,
        learning_rate: float = 0.001,
        l2_lambda: float = 0.0001,
        initial_half_life: float = 120.0,
    ):
        # Priors for θ based on common spaced-repetition patterns
        # We add a bias term implicitly by how we initialize and update
        self.theta = np.array([
            2.0,   # n_correct
           -2.0,   # n_incorrect
            0.5,   # n_exposures
           -0.1,   # avg_response_time
            1.5,   # streak
            0.5,   # last_gap
           -1.0,   # difficulty
        ])
        self.lr = learning_rate
        self.l2 = l2_lambda
        self.initial_half_life = initial_half_life
        self.log2_initial_h = np.log2(initial_half_life)

    def get_features(self, m: ConceptMemory) -> np.ndarray:
        """Transforms ConceptMemory into the feature vector x."""
        return np.array([
            np.log1p(m.n_correct),
            np.log1p(m.n_incorrect),
            np.log1p(m.n_exposures),
            np.log1p(m.avg_response_time),
            np.log1p(m.streak),
            np.log1p(m.last_gap / 60.0), # normalize gap to minutes
            m.difficulty,
        ])

    def predict_half_life(self, m: ConceptMemory) -> float:
        """Predicts half-life h = 2^(log2(initial_h) + θ · x)."""
        if m.n_exposures == 0:
            return self.initial_half_life
        
        x = self.get_features(m)
        log2_h = self.log2_initial_h + float(np.dot(self.theta, x))
        h = 2.0 ** log2_h
        
        # Clamp half-life between 5 seconds and 1 year
        return float(np.clip(h, 5.0, 31536000.0))

    def predict_recall(self, m: ConceptMemory, now: float = None) -> float:
        """Predicts probability of recall P = 2^(-Δt / h)."""
        now = now or time()
        delta_t = max(0.001, now - m.last_reviewed_at)
        
        # Use initial half-life if never reviewed
        h = m.half_life if m.n_exposures > 0 else self.initial_half_life
        
        p = 2.0 ** (-delta_t / h)
        return float(np.clip(p, 0.0, 1.0))

    def update(self, m: ConceptMemory, correct: bool, response_time: float):
        """Performs an online SGD update on θ after an interaction."""
        now = time()
        
        # Calculate gap since last review
        if m.n_exposures > 0:
            m.last_gap = now - m.last_reviewed_at

        # Target recall probability (1.0 if correct, 0.0 if incorrect)
        p_actual = 1.0 if correct else 0.0
        p_pred = self.predict_recall(m, now)
        
        # SGD Update
        x = self.get_features(m)
        error = p_actual - p_pred
        
        # Gradient of the squared error with respect to theta
        # Using a simplified gradient for online learning
        gradient = -error * x + self.l2 * self.theta
        self.theta -= self.lr * gradient

        # Update concept memory state
        m.n_exposures += 1
        if correct:
            m.n_correct += 1
            m.streak += 1
        else:
            m.n_incorrect += 1
            m.streak = 0
            
        # Moving average for response time
        m.avg_response_time = (
            (m.avg_response_time * (m.n_exposures - 1) + response_time)
            / m.n_exposures
        )
        
        m.last_reviewed_at = now
        m.half_life = self.predict_half_life(m)


class GameMemoryStore:
    """Manages memory states for all concepts in a session."""

    def __init__(self, concept_keys: List[str], hlr: HalfLifeRegression):
        self.hlr = hlr
        self.memories: Dict[str, ConceptMemory] = {
            k: ConceptMemory(key=k, half_life=hlr.initial_half_life)
            for k in concept_keys
        }

    def get(self, key: str) -> ConceptMemory:
        return self.memories[key]

    def get_all_recall_probs(self) -> Dict[str, float]:
        """Calculates current recall probability for all concepts."""
        now = time()
        return {
            k: self.hlr.predict_recall(m, now)
            for k, m in self.memories.items()
        }

    def process_answer(self, key: str, correct: bool, response_time: float):
        """Updates the memory state for a given concept."""
        if key in self.memories:
            self.hlr.update(self.memories[key], correct, response_time)
