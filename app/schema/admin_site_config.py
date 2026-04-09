from pydantic import BaseModel, Field


class SiteConfigUpdateIn(BaseModel):
    home_hero_title: str = Field(min_length=1, max_length=255)
    home_hero_subtitle: str = Field(min_length=1, max_length=500)
    service_highlights: str = Field(min_length=2, max_length=10000)
    contact_channels: str = Field(min_length=2, max_length=20000)

