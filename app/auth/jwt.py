from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.config.settings import ADMIN_JWT_EXPIRES_MINUTES, ADMIN_JWT_SECRET


def _get_secret() -> str:
    secret = (ADMIN_JWT_SECRET or "").strip()
    if not secret:
        raise RuntimeError("jwt.admin_secret is required in app/config/config_dev.yml")
    return secret


def get_access_token_expires_minutes() -> int:
    value = int(ADMIN_JWT_EXPIRES_MINUTES or 720)
    return max(5, min(value, 60 * 24 * 14))


def create_access_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=get_access_token_expires_minutes())
    payload = {"sub": subject, "iat": int(now.timestamp()), "exp": int(exp.timestamp())}
    return jwt.encode(payload, _get_secret(), algorithm="HS256")


def decode_subject(token: str) -> str:
    try:
        payload = jwt.decode(token, _get_secret(), algorithms=["HS256"])
        sub = payload.get("sub")
        if not sub or not isinstance(sub, str):
            raise ValueError("missing sub")
        return sub
    except (JWTError, ValueError) as e:
        raise ValueError("invalid token") from e

