from datetime import datetime

import json
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.model.case import CaseEventType, CasePublishStatus


def _parse_json_array(value: str, field_name: str) -> list[Any]:
    try:
        parsed = json.loads(value)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError(f"{field_name} must be a valid JSON array") from exc
    if not isinstance(parsed, list):
        raise ValueError(f"{field_name} must be a JSON array")
    return parsed


def _validate_object_array(
    value: str,
    field_name: str,
    *,
    max_items: int,
    fields: dict[str, tuple[int, int, bool]],
    enforce_minimums: bool = True,
) -> str:
    parsed = _parse_json_array(value, field_name)
    if len(parsed) > max_items:
        raise ValueError(f"{field_name} must contain at most {max_items} items")
    allowed_fields = set(fields)
    for index, item in enumerate(parsed):
        if not isinstance(item, dict) or set(item) - allowed_fields:
            raise ValueError(f"{field_name}[{index}] has an invalid structure")
        for key, (min_length, max_length, optional) in fields.items():
            field_value = item.get(key)
            if optional and (field_value is None or field_value == ""):
                continue
            if not isinstance(field_value, str):
                raise ValueError(f"{field_name}[{index}].{key} must be a string")
            length = len(field_value.strip())
            if (enforce_minimums and length < min_length) or length > max_length:
                raise ValueError(
                    f"{field_name}[{index}].{key} must be {min_length}-{max_length} characters"
                )
    return value


class CaseWriteBase(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    event_type: CaseEventType
    summary: str = Field(min_length=1, max_length=500)
    cover_image_url: str = Field(min_length=1, max_length=1000)
    gallery_urls: str = Field(default="[]", max_length=20000)
    project_background: str | None = Field(default=None, max_length=2000)
    project_goals: str | None = Field(default=None, max_length=1000)
    execution_highlights: str = Field(default="[]", max_length=20000)
    result_metrics: str = Field(default="[]", max_length=20000)
    result_summary: str | None = Field(default=None, max_length=1000)
    tags: str = Field(default="[]", max_length=20000)
    seo_title: str = Field(default="", max_length=255)
    seo_description: str = Field(default="", max_length=500)
    publish_status: CasePublishStatus = CasePublishStatus.DRAFT

    @field_validator("execution_highlights")
    @classmethod
    def validate_execution_highlights(cls, value: str) -> str:
        return _validate_object_array(
            value,
            "execution_highlights",
            max_items=6,
            fields={"title": (2, 40, False), "description": (10, 500, False)},
            enforce_minimums=False,
        )

    @field_validator("result_metrics")
    @classmethod
    def validate_result_metrics(cls, value: str) -> str:
        return _validate_object_array(
            value,
            "result_metrics",
            max_items=6,
            fields={
                "label": (1, 20, False),
                "value": (1, 30, False),
                "description": (0, 100, True),
            },
            enforce_minimums=False,
        )

    @model_validator(mode="after")
    def validate_publish_completeness(self):
        if self.publish_status is not CasePublishStatus.PUBLISHED:
            return self

        background = (self.project_background or "").strip()
        goals = (self.project_goals or "").strip()
        highlights = _parse_json_array(
            self.execution_highlights, "execution_highlights"
        )
        _validate_object_array(
            self.execution_highlights,
            "execution_highlights",
            max_items=6,
            fields={"title": (2, 40, False), "description": (10, 500, False)},
        )
        _validate_object_array(
            self.result_metrics,
            "result_metrics",
            max_items=6,
            fields={
                "label": (1, 20, False),
                "value": (1, 30, False),
                "description": (0, 100, True),
            },
        )
        errors = []
        if not 20 <= len(background) <= 2000:
            errors.append("project_background must be 20-2000 characters when published")
        if not 10 <= len(goals) <= 1000:
            errors.append("project_goals must be 10-1000 characters when published")
        if not 1 <= len(highlights) <= 6:
            errors.append("execution_highlights must contain 1-6 items when published")
        if errors:
            raise ValueError("; ".join(errors))
        return self


class CaseAdminListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    event_type: str
    summary: str
    cover_image_url: str
    publish_status: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CaseAdminDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    event_type: str
    summary: str
    cover_image_url: str
    gallery_urls: str
    project_background: str | None = None
    project_goals: str | None = None
    execution_highlights: str | None = "[]"
    result_metrics: str | None = "[]"
    result_summary: str | None = None
    publish_status: str
    published_at: datetime | None
    tags: str
    seo_title: str
    seo_description: str
    created_at: datetime
    updated_at: datetime


class CaseCreateIn(CaseWriteBase):
    slug: str = Field(min_length=1, max_length=200)


class CaseUpdateIn(CaseWriteBase):
    published_at: datetime | None = None
