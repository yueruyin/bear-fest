from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.jwt import decode_subject
from app.database import get_db
from app.model import Role, User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="not authenticated")
    token = credentials.credentials
    try:
        username = decode_subject(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="invalid admin")
    role = db.query(Role).filter(Role.id == user.role_id).first()
    if not role or role.name != "admin":
        raise HTTPException(status_code=403, detail="forbidden")
    return user

