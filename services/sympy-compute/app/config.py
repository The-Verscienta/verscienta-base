from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_key: str = "changeme"
    cache_url: str = "redis://localhost:6379/0"
    cache_ttl_seconds: int = 86400  # 24 hours
    log_level: str = "info"
    max_request_size: int = 10240  # 10KB

    model_config = {"env_prefix": "", "case_sensitive": False}


settings = Settings()
