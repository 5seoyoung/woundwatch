from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    hf_model_repo: str = "5seoyoung/woundwatch-gemma4-e4b"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "woundwatch"
    use_ollama: bool = False          # True면 Ollama, False면 HF 모델 직접 로드
    upload_dir: str = "uploads"
    database_url: str = "sqlite:///./woundwatch.db"
    max_image_mb: int = 10

    class Config:
        env_file = ".env"

settings = Settings()
