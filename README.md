# 🗺️ The Forgettery — Spatio-Temporal Memory Cartography

The Forgettery is a world-class machine learning project for educational hackathons. It visualizes and models student memory decay in real-time, creating a "living map" of knowledge.

## 🧠 Core Intelligence

### 1. Spaced Repetition (HLR)
The system uses a custom **Half-Life Regression** engine (inspired by Settles & Meeder, 2016) to predict the exponential decay of concepts. Each "tile" on the grid represents a concept whose half-life grows with successful recall and shrinks with neglect.

### 2. Spatial Uncertainty (Gaussian Process)
A **Gaussian Process Regressor** (RBF kernel) analyzes your demonstrated mastery at specific grid points and interpolates uncertainty across the map. This drives the "Knowledge Fog"—hiding areas where the system lacks data on your proficiency.

### 3. Dynamic Curriculum (Gemini API)
Powered exclusively by **Google Gemini**, the game procedurally generates custom 12x12 curriculum grids for *any* topic—from "Quantum Computing" to "Ancient History"—at runtime.

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- **Gemini API Key** (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Installation

1. **Clone & Setup Backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=sqlite:///./forgettery.db
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.0-flash
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Execution
1. **Start Backend:** `cd backend && uvicorn app.main:app --port 8000`
2. **Start Frontend:** `cd frontend && npm run dev`

## 🎮 How to Play
1. **Neural Sync:** On the landing page, enter any topic you want to master. Gemini will generate a custom landscape of 30 concepts.
2. **Navigation:** Use **WASD** or **Arrow Keys** to move your "Neural Probe" across the grid.
3. **Recall:** Stepping on a tile triggers a Gemini-generated MCQ. Successful recall stabilizes the tile and boosts its half-life.
4. **The Void:** Ignore tiles too long, and they will crack and vanish into the Void, becoming impassable.
5. **Dashboard:** Open the sidebar to see live ML telemetry—uncertainty heatmaps, decay trends, and your behavioral profile (e.g., "Neural Speedrunner").

---
*Built for the ML Hackathon 2026.*
