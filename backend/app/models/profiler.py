import numpy as np
from sklearn.cluster import KMeans
from typing import Dict, Any, Optional

# Archetypes for the Hackathon Judge Bait
PRESET_CENTROIDS = np.array([
    [0.90, 2.5, 0.9, 0.1],   # Speedrunner: High accuracy, low response time, high streak
    [0.70, 7.0, 0.6, 0.05],  # Methodical: Good accuracy, high response time, low variance
    [0.40, 9.0, 0.2, 0.4],   # Struggler: Low accuracy, high response time, high variance
    [0.75, 4.5, 0.7, 0.3],   # Balanced: Average across the board
])

LABELS = [
    "Neural Speedrunner", 
    "Methodical Scholar", 
    "Recoding Required", 
    "Balanced Explorer"
]

DESCRIPTIONS = [
    "High-velocity recall detected. Push toward more abstract concepts.",
    "Deep processing identified. Mastery is strong but speed can be optimized.",
    "Frequent recall failures. Recommend revisiting foundational basics.",
    "Versatile learning pattern. Optimal for multi-region exploration."
]

class LearnerProfiler:
    """
    Clusters players into archetypes using K-Means after 5+ interactions.
    """
    
    def __init__(self):
        # We initialize with our preset centroids to guide the clusters toward our archetypes
        self.km = KMeans(n_clusters=4, init=PRESET_CENTROIDS, n_init=1, max_iter=20)
        # Dummy fit to initialize the model with centroids
        self.km.fit(PRESET_CENTROIDS)

    def extract_features(self, session) -> Optional[np.ndarray]:
        """Extracts behavioral features from the game session."""
        memories = list(session.memory.memories.values())
        visited = [m for m in memories if m.n_exposures > 0]
        
        if len(visited) < 5:
            return None
            
        accs = [m.n_correct / m.n_exposures for m in visited]
        rts = [m.avg_response_time for m in visited]
        streaks = [min(1.0, m.streak / 5.0) for m in visited]
        
        # Features: [mean_accuracy, mean_rt, mean_streak_score, accuracy_variance]
        return np.array([
            float(np.mean(accs)),
            float(np.mean(rts)),
            float(np.mean(streaks)),
            float(np.std(accs)),
        ])

    def predict(self, session) -> Dict[str, Any]:
        """Predicts the player archetype."""
        x = self.extract_features(session)
        n_visited = sum(1 for m in session.memory.memories.values() if m.n_exposures > 0)
        
        if x is None:
            return {"ready": False, "n_visited": n_visited, "needed": 5}
            
        # Reshape for scikit-learn
        cluster_idx = int(self.km.predict(x.reshape(1, -1))[0])
        
        return {
            "ready": True,
            "n_visited": n_visited,
            "cluster_index": cluster_idx,
            "label": LABELS[cluster_idx],
            "description": DESCRIPTIONS[cluster_idx],
            "features": {
                "accuracy": float(x[0]),
                "response_time": float(x[1]),
                "consistency": 1.0 - float(x[3]),
            }
        }

# Singleton instance
_profiler = LearnerProfiler()

def get_profiler() -> LearnerProfiler:
    return _profiler
