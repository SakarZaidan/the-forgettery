from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Professional database setup
engine = create_engine(
    settings.database_url, 
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initializes the database schema."""
    with engine.connect() as conn:
        # Players table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                display_name TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """))
        
        # Concept states (Memory snapshots)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS concept_states (
                id TEXT PRIMARY KEY,
                player_id TEXT,
                concept_key TEXT,
                half_life REAL DEFAULT 120.0,
                n_correct INTEGER DEFAULT 0,
                n_incorrect INTEGER DEFAULT 0,
                n_exposures INTEGER DEFAULT 0,
                last_reviewed_at TEXT,
                streak INTEGER DEFAULT 0,
                avg_response_time REAL DEFAULT 5.0,
                last_gap REAL DEFAULT 0.0,
                UNIQUE(player_id, concept_key)
            )
        """))
        
        # Interaction log (for training ML models)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS interactions (
                id TEXT PRIMARY KEY,
                player_id TEXT,
                concept_key TEXT,
                correct INTEGER,
                response_time_ms INTEGER,
                recall_probability REAL,
                created_at TEXT DEFAULT (datetime('now'))
            )
        """))
        conn.commit()

def get_db():
    """Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
