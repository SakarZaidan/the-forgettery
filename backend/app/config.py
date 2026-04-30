from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./forgettery.db"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
 # Defaulting to 2.0 as 2.5 is not yet a standard release
    decay_tick_interval: float = 1.0
    initial_half_life: float = 120.0
    gp_length_scale: float = 1.5
    thompson_lambda: float = 0.6
    void_threshold: float = 0.2
    backend_port: int = 8000
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
