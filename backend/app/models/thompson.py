import numpy as np
from typing import Dict, List, Any
from app.config import settings

def thompson_recommend(
    alpha_map: Dict[str, float],
    beta_map: Dict[str, float],
    urgency_map: Dict[str, float],
) -> Dict[str, Any]:
    """
    Implements Thompson Sampling to recommend the optimal learning region.
    Balancing:
    1. Exploitation (Fixing urgent/forgotten concepts)
    2. Exploration (Demonstrating mastery in new regions)
    
    Returns:
        {
            "recommended_region": str,
            "scores": Dict[str, float],
            "samples": Dict[str, float]
        }
    """
    scores = {}
    samples = {}
    
    for region in alpha_map.keys():
        # Sample from the Beta distribution (Exploration)
        # Higher alpha relative to beta -> system thinks you are better at this
        # We sample 'potential success'
        sample = float(np.random.beta(alpha_map[region], beta_map[region]))
        samples[region] = sample
        
        # Urgency is (1 - recall_probability) (Exploitation)
        urgency = urgency_map.get(region, 0.0)
        
        # Weighted combination
        # Lower sample (struggling) + Higher urgency -> High priority
        # But Thompson lets us occasionally explore regions where we might have mastery
        score = (
            settings.thompson_lambda * (1.0 - sample) + 
            (1.0 - settings.thompson_lambda) * urgency
        )
        scores[region] = score
        
    best_region = max(scores, key=scores.get)
    
    return {
        "recommended_region": best_region,
        "scores": scores,
        "samples": samples,
        "urgency": urgency_map,
    }
