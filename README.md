# The Forgettery — Spatio-Temporal Memory Cartography

Navigate a living 12×12 isometric map of any subject you choose. Every tile is a concept. Every answer reshapes the map. Leave tiles unvisited long enough and they decay, crack, and vanish into the void.

The game is a real-time visualisation of your memory — powered by four ML models running continuously in the backend.

---

## ML Core

### Half-Life Regression (HLR)

Each tile has a **half-life**: the amount of time before your recall probability drops to 50%. Correct answers grow the half-life; wrong answers shrink it; fast correct answers grow it faster (confidence signal). After every answer the model runs online SGD to update a shared weight vector that learns _your specific memory curve_ across the whole subject.

```
P(recall) = 2^( −Δt / h )
log₂(h)   = log₂(h₀) + θ · x
```

Tile colours reflect live recall probability: cyan (> 80%) → amber/cracked (20–80%) → void (≤ 20%).

### Gaussian Process Uncertainty

A GP Regressor (RBF + ConstantKernel + WhiteKernel) fits on every tile you've visited, using grid position, difficulty, and category as features and your accuracy as the target. It then predicts expected performance **and uncertainty** across all 144 tiles. High uncertainty = deep fog. As you explore, the fog lifts in nearby regions even before you visit them — the GP infers similarity from spatial proximity.

### Thompson Sampling (Compass)

Each concept category maintains a Beta distribution `Beta(α, β)` tracking your success rate. At each step the compass samples from each category's Beta distribution, blends the sample with the category's decay urgency `(1 − mean_recall)`, and points the probe at the highest-priority region. The stochastic sampling means the compass occasionally steers you toward unexplored areas rather than always firefighting the worst-decaying tile.

### K-Means Learner Profiler

After 5+ answered questions the profiler clusters your behaviour into one of four archetypes using `[accuracy, response_time, streak_score, accuracy_variance]` as features. Centroids are pre-seeded to meaningful archetypes so clusters are interpretable from the start:

| Archetype          | Signal                             |
| ------------------ | ---------------------------------- |
| Neural Speedrunner | High accuracy, low response time   |
| Methodical Scholar | Good accuracy, slow and deliberate |
| Recoding Required  | Low accuracy, high response time   |
| Balanced Explorer  | Average across all dimensions      |

---

## Tech Stack

| Layer      | Technology                                                         |
| ---------- | ------------------------------------------------------------------ |
| Frontend   | React 19, Vite, Tailwind v4                                        |
| Grid       | Isometric SVG, painter's algorithm                                 |
| Fonts      | Orbitron (HUD), Exo 2 (body), JetBrains Mono (data)                |
| Backend    | FastAPI, Python 3.10+                                              |
| ML         | NumPy, scikit-learn (GP, K-Means), custom HLR + Thompson           |
| Curriculum | Google Gemini API (144 concepts per topic, procedurally generated) |
| Storage    | SQLite (sessions in-memory, no persistence across restarts)        |

---

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Gemini API key — get one at [aistudio.google.com](https://aistudio.google.com/)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
DATABASE_URL=sqlite:///./forgettery.db
```

Start the server:

```bash
uvicorn app.main:app --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## How to Play

1. **Enter a topic** on the landing page. Gemini generates a full 12×12 curriculum grid (144 concepts across 6 difficulty categories) for that subject.
2. **Move your probe** with WASD or arrow keys across the isometric grid.
3. **Press Space** on any tile to trigger a Gemini-generated multiple-choice question about that concept.
4. **Answer correctly** to stabilise the tile and extend its half-life. Answer wrong and the half-life shrinks — the tile will decay faster.
5. **Watch the fog** — areas near tiles you've mastered clear up as the GP infers your likely performance there.
6. **Follow the compass** — the Neural Guidance widget points toward whichever region the Thompson Sampler has flagged as most urgent or most worth exploring.
7. **Check the dashboard** (right panel) for live decay curves, mastery distribution, your learner archetype, and session stats.

Tiles decay continuously in real time. The map never stays static.

---

## Further Reading

See [`explanation.md`](./explanation.md) for a full plain-English + technical breakdown of every ML system.
