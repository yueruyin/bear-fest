from pydantic import BaseModel, Field


class AdminLoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=200)


class AdminTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

