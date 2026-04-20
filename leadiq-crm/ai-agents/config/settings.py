from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-4-5"
    anthropic_max_tokens: int = 4096
    redis_url: str = "redis://localhost:6379"
    redis_password: str = ""
    database_url: str = ""
    backend_url: str = "http://backend:4000"
    serp_api_key: str = ""
    github_token: str = ""
    product_hunt_api_key: str = ""
    agent_task_timeout_seconds: int = 120

    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = False

settings = Settings()
