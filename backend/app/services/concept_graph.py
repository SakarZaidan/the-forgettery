import json
from typing import Dict, List, Optional
import numpy as np

class ConceptGraph:
    """Manages the spatial layout and features of educational concepts."""
    
    def __init__(self, data: Optional[dict] = None):
        if data:
            self.load_data(data)
        else:
            self.subject = "Initializing..."
            self.grid_size = 12
            self.concepts = {}
            self.keys = []
            self.position_map = {}
            self.feature_matrix = np.empty((0, 0))

    def load_data(self, data: dict):
        self.subject = data["subject"]
        self.grid_size = data["grid_size"]
        self.concepts: Dict[str, dict] = {c["key"]: c for c in data["concepts"]}
        self._build_maps()
        self._build_feature_matrix()

    def _build_maps(self):
        self.position_map = {
            (c["grid_x"], c["grid_y"]): c["key"]
            for c in self.concepts.values()
        }
        self.keys = list(self.concepts.keys())
        self.key_index = {k: i for i, k in enumerate(self.keys)}

    def _build_feature_matrix(self):
        categories = sorted(set(c["category"] for c in self.concepts.values()))
        cat_index = {c: i for i, c in enumerate(categories)}
        feats = []
        for k in self.keys:
            c = self.concepts[k]
            row = [c["grid_x"] / (self.grid_size - 1), c["grid_y"] / (self.grid_size - 1), (c["difficulty"] - 1) / 4.0]
            one_hot = [0.0] * len(categories)
            one_hot[cat_index[c["category"]]] = 1.0
            row.extend(one_hot)
            feats.append(row)
        self.feature_matrix = np.array(feats)

    def get_concept_at(self, x: int, y: int) -> Optional[dict]:
        key = self.position_map.get((x, y))
        return self.concepts.get(key) if key else None

    def get_features(self, key: str) -> np.ndarray:
        return self.feature_matrix[self.key_index[key]]

    def all_concepts(self) -> List[dict]:
        return list(self.concepts.values())

# Empty graph to be populated via the /start endpoint
global_graph = ConceptGraph()
