import time
import pytest
from app.models.hlr import HalfLifeRegression, ConceptMemory

def test_initial_recall_high():
    hlr = HalfLifeRegression()
    m = ConceptMemory(key="test")
    p = hlr.predict_recall(m)
    # Immediately after creation (or review), recall should be ~1.0
    assert p > 0.99

def test_decay_over_time():
    hlr = HalfLifeRegression()
    # Half-life of 10 seconds
    m = ConceptMemory(key="test", half_life=10.0, n_exposures=1)
    m.last_reviewed_at = time.time() - 10
    p = hlr.predict_recall(m)
    # After exactly one half-life, recall should be 0.5
    assert 0.45 < p < 0.55

def test_correct_answer_increases_half_life():
    hlr = HalfLifeRegression()
    m = ConceptMemory(key="test")
    initial_h = hlr.predict_half_life(m)
    hlr.update(m, correct=True, response_time=2.0)
    # Half-life should increase after a correct answer
    assert m.half_life > initial_h

def test_incorrect_answer_decreases_half_life():
    hlr = HalfLifeRegression()
    m = ConceptMemory(key="test")
    # Build some memory first
    for _ in range(3):
        hlr.update(m, correct=True, response_time=1.0)
    
    h_before = m.half_life
    hlr.update(m, correct=False, response_time=10.0)
    # Half-life should decrease after an incorrect answer
    assert m.half_life < h_before
