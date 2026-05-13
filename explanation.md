# The Forgettery — How It Works

---

## What Is This Game?

The Forgettery is a learning game that turns studying into exploration.

You control a probe moving across a 12×12 grid. Each tile on the grid is a concept — a piece of knowledge in whatever subject you chose (e.g. Python, Ancient Rome, Quantum Physics). When you walk onto a tile and press Space, the game asks you a multiple-choice question about that concept.

The twist: **the game never forgets how well you're doing, and the tiles decay over time.** A tile you answered correctly yesterday is weaker today, because that's how human memory actually works. The goal is to keep all 144 tiles healthy — which means revisiting them before they fade.

This isn't just a quiz app. Every answer you give feeds a small set of machine learning models that track your memory, predict where you're about to forget, and guide your probe toward the most urgent concepts. The map is a live picture of your brain.

---

## The Purpose

Most flashcard apps (like Anki) schedule reviews in a fixed queue. You do card 1, then card 2, then card 3. The Forgettery turns that into a game where *you* navigate — but the ML underneath is doing the same job: making sure you see the right concept at the right moment before it slips away. The isometric grid makes the invisible (memory decay across a whole subject) visible and spatial.

---

## The Four ML Systems

---

### 1. Half-Life Regression (HLR)
**The memory clock for each tile**

#### Simply

Think of memory like a radioactive substance that decays over time. If you learn something today, tomorrow you'll remember maybe 80% of it. The day after, maybe 60%. Left long enough, it fades to almost nothing.

HLR puts a clock on each tile. The clock is called a **half-life** — the amount of time it takes for your recall probability to drop to 50%. A strong memory has a long half-life (days). A weak one has a short half-life (minutes).

When you answer a question:
- **Correct** → the tile's half-life grows (you remember it longer)
- **Incorrect** → the half-life shrinks (you need to see it again sooner)
- **Fast correct answer** → bigger boost (you knew it cold)
- **Answered it many times in a row** → streak bonus

The tile's colour on the grid reflects this: cyan = healthy, amber = fading, red-dashed = nearly forgotten.

#### Technically

Based on [Settles & Meeder, 2016]. The recall probability at time `t` is:

```
P(recall) = 2^( -Δt / h )
```

where `Δt` is the time elapsed since last review and `h` is the predicted half-life.

The half-life is predicted by a linear model in log space:

```
log₂(h) = log₂(h₀) + θ · x
```

The feature vector `x` encodes the learner's history for that concept:

| Feature | What it captures |
|---|---|
| `log1p(n_correct)` | How many times you got it right |
| `log1p(n_incorrect)` | How many times you got it wrong |
| `log1p(n_exposures)` | Total visits |
| `log1p(avg_response_time)` | How quickly you answer (fast = confident) |
| `log1p(streak)` | Consecutive correct answers |
| `log1p(last_gap / 60)` | How long since you last reviewed it |
| `difficulty` | The concept's inherent difficulty (1–5) |

The weight vector `θ` is updated after every answer via **online SGD** (Stochastic Gradient Descent):

```
error     = p_actual − p_predicted        (1 or 0 vs model's estimate)
gradient  = −error · x + λ · θ           (L2 regularisation to prevent overfitting)
θ_new     = θ_old − α · gradient
```

Learning rate `α = 0.001`, L2 `λ = 0.0001`. Half-life is clamped between 5 seconds and 1 year. The model is **shared across all concepts** — it learns what features generally predict strong memory for *this player*, then applies that to every tile.

---

### 2. Gaussian Process (GP)
**The fog of war**

#### Simply

A Gaussian Process is a model that makes predictions while also admitting *how confident it is*. Think of it like a weather forecast: it doesn't just say "it'll be 20°C tomorrow" — it says "20°C, give or take 3 degrees."

In The Forgettery, the GP looks at the tiles you've visited and how well you did on them, then predicts your likely performance on the tiles you *haven't* visited yet — and how uncertain that prediction is.

On the grid this shows up as the fog: tiles far from anywhere you've explored are shrouded because the model has no idea how you'll do there. Tiles near areas you've mastered are less foggy because the GP infers you probably know the neighbouring concepts too.

#### Technically

The GP uses a composite kernel:

```
k(x, x') = C · RBF(x, x'; ℓ) + WhiteNoise(σ²)
```

- `C` (ConstantKernel) — overall output variance
- `RBF` — Radial Basis Function, enforces spatial smoothness: nearby concepts in feature space should have similar performance
- `WhiteKernel` — observation noise (you might get lucky or have a bad moment)

Input features `x` per concept: `[grid_x / 11, grid_y / 11, (difficulty − 1) / 4, one-hot category]`

Targets `y`: accuracy at that tile `= n_correct / n_exposures` (only visited tiles are used to fit).

After fitting on visited tiles, `gp.predict(X_all, return_std=True)` gives:
- `mean` → expected performance at every tile
- `std` → uncertainty (high std = deep fog)

Before 2+ tiles are visited the GP is unfitted and returns `(0.5, 0.5)` everywhere — maximum uncertainty, uniform fog.

On the frontend the fog map is approximated with a **Gaussian kernel blur** (σ = 2.8) over visited tiles for a smooth real-time visual without a server round-trip.

---

### 3. Thompson Sampling
**The compass — where to go next**

#### Simply

Imagine you're at a buffet you've never been to. You could go straight for the food you already know you love (exploit), or try something new that might be amazing or terrible (explore). Thompson Sampling is an algorithm that automatically balances those two choices.

In the game, each category of concepts (e.g. "basics", "advanced") gets a score based on two things:

1. **How much you're struggling there** — categories where your recall is low are urgent
2. **How uncertain the model is about your performance there** — categories you haven't explored much are worth trying

The compass arrow on the grid always points to the highest-priority region — the system's best guess at where your time is most valuable right now.

#### Technically

Each category maintains a **Beta distribution** `Beta(α, β)` representing the model's belief about your success rate:
- `α` starts at 1, increments with each correct answer in that category
- `β` starts at 1, increments with each incorrect answer

At each recommendation step the model:

1. **Samples** a value from `Beta(α, β)` for each category — this is the "exploration" draw. High α relative to β → sample likely near 1.0 (you're good here). Low α → sample likely low.
2. **Computes urgency** per category: `urgency = 1 − mean_recall_probability` — how much the concepts are fading.
3. **Scores** each category:
   ```
   score = λ · (1 − sample) + (1 − λ) · urgency
   ```
   `λ = 0.5` by default — equal weight to exploration and exploitation.

The category with the highest score becomes the `recommended_region`. Because step 1 involves random sampling from Beta distributions, the compass occasionally points to a less-urgent region to encourage exploration — this is the hallmark of Thompson Sampling.

---

### 4. K-Means Learner Profiler
**What kind of learner are you?**

#### Simply

After you've answered at least 5 questions, the game analyses your behaviour and assigns you to one of four player archetypes:

| Archetype | What it means |
|---|---|
| **Neural Speedrunner** | Fast and accurate — you know your stuff |
| **Methodical Scholar** | Slow but correct — you think before answering |
| **Recoding Required** | Struggling — foundational review needed |
| **Balanced Explorer** | Average across the board |

This label shows up in the right-side dashboard. It's not just cosmetic — it's a real cluster assignment from the model.

#### Technically

The profiler uses **K-Means clustering** with 4 clusters, pre-seeded with handcrafted centroids so the clusters map onto meaningful archetypes:

```python
PRESET_CENTROIDS = [
    [0.90, 2.5, 0.9, 0.1],   # Speedrunner: high acc, low RT, high streak, low variance
    [0.70, 7.0, 0.6, 0.05],  # Methodical:  good acc, high RT, medium streak
    [0.40, 9.0, 0.2, 0.4],   # Struggler:   low acc, high RT, low streak, high variance
    [0.75, 4.5, 0.7, 0.3],   # Balanced:    average everywhere
]
```

The feature vector extracted per session (after 5+ visited tiles):

```
x = [mean_accuracy, mean_response_time, mean_streak_score, accuracy_std]
```

`accuracy_std` (standard deviation of accuracy across tiles) is a key discriminator: a Speedrunner has low variance (consistent), a Struggler has high variance (very concept-dependent).

`KMeans.predict(x)` returns the index of the nearest centroid → label lookup.

---

## How All Four Systems Connect

```
You answer a question
        │
        ▼
  HLR updates the half-life of that tile
  (θ learns your memory curve, tile colour changes)
        │
        ▼
  GP refits on all visited tiles
  (fog lifts near mastered areas, thickens in unknown territory)
        │
        ▼
  Thompson Sampling re-scores all categories
  (compass arrow updates — where is most urgent/interesting?)
        │
        ▼
  Profiler re-clusters your behaviour
  (archetype label updates after every few answers)
        │
        ▼
  All 144 tiles decay in real time as seconds pass
  (HLR P(recall) = 2^(-Δt/h) → tile colours shift from cyan → amber → void)
```

The game ends when you decide to stop — but the right answer is never to stop, because the tiles never stop decaying.

---

## Tile States at a Glance

| Colour | State | Recall probability |
|---|---|---|
| Cyan (bright) | Healthy | > 80% |
| Amber/cracked | Decaying | 20–80% |
| Dark red dashed | Void | ≤ 20% |
| Dimmed category colour | Fog | Never visited |
