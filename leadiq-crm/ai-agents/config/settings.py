from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- AI ---
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-opus-4-5"
    anthropic_max_tokens: int = 4096

    # --- infra ---
    redis_url: str = "redis://localhost:6379"
    redis_password: str = ""
    database_url: str = ""
    backend_url: str = "http://backend:4000"

    # --- lead sources (all optional; every source degrades to "unavailable"
    #     rather than fabricating data) ---
    serp_api_key: str = ""
    github_token: str = ""
    product_hunt_api_key: str = ""

    # Reddit: works keyless at a low rate limit. A free app registration at
    # https://www.reddit.com/prefs/apps lifts the allowance substantially.
    # Reddit *requires* a descriptive User-Agent or it returns 429.
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "linux:leadiq-crm:v1.0 (lead discovery)"

    agent_task_timeout_seconds: int = 120

    # Discovery limits
    discovery_max_per_source: int = 25
    discovery_min_confidence: float = 0.35

    class Config:
        env_file = ".env"
        extra = "ignore"
        case_sensitive = False


settings = Settings()
