from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import MerchantSignup, MerchantSignupFile
from app.schema import MerchantSignupCreateOut

router = APIRouter()

UPLOADS_ROOT = Path("app/uploads")
MERCHANT_UPLOAD_DIR = UPLOADS_ROOT / "merchant"
MERCHANT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/api/v1/merchant-signups",
    response_model=MerchantSignupCreateOut,
    status_code=201,
)
async def create_merchant_signup(
    contact_name: str = Form(...),
    brand_name: str | None = Form(default=None),
    phone_or_email: str = Form(...),
    business_details: str = Form(...),
    files: list[UploadFile] | None = File(default=None),
    db: Session = Depends(get_db),
):
    if len(contact_name.strip()) == 0:
        raise HTTPException(status_code=422, detail="contact_name is required")
    if len(phone_or_email.strip()) < 3:
        raise HTTPException(status_code=422, detail="phone_or_email is invalid")
    if len(business_details.strip()) < 10:
        raise HTTPException(
            status_code=422, detail="business_details must be at least 10 chars"
        )

    merchant_signup = MerchantSignup(
        contact_name=contact_name.strip(),
        brand_name=brand_name.strip() if brand_name else None,
        phone_or_email=phone_or_email.strip(),
        business_details=business_details.strip(),
        status="new",
    )
    db.add(merchant_signup)
    db.flush()  # 获取 merchant_signup.id

    for upload in files or []:
        if not upload.filename:
            continue
        suffix = Path(upload.filename).suffix
        saved_name = f"{uuid4().hex}{suffix}"
        saved_path = MERCHANT_UPLOAD_DIR / saved_name

        file_bytes = await upload.read()
        with open(saved_path, "wb") as fp:
            fp.write(file_bytes)

        db.add(
            MerchantSignupFile(
                merchant_signup_id=merchant_signup.id,
                file_url=f"/uploads/merchant/{saved_name}",
                file_name=upload.filename,
            )
        )

    db.commit()
    db.refresh(merchant_signup)
    return merchant_signup

