from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SiteConfigOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    home_hero_title: str
    home_hero_subtitle: str
    service_highlights: str
    contact_channels: str
    updated_at: datetime
