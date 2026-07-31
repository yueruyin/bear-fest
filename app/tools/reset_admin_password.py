from __future__ import annotations

import argparse
from getpass import getpass

from app.auth import hash_password
from app.database import SessionLocal
from app.model import User


def main() -> None:
    parser = argparse.ArgumentParser(description="Reset a Bear Fest administrator password.")
    parser.add_argument("--username", default="admin")
    args = parser.parse_args()

    password = getpass("新管理员密码：")
    confirmation = getpass("再次输入新密码：")
    if password != confirmation:
        raise SystemExit("两次输入的密码不一致。")
    if len(password) < 12:
        raise SystemExit("管理员密码长度至少需要12位。")

    with SessionLocal() as db:
        user = db.query(User).filter(User.username == args.username).first()
        if not user:
            raise SystemExit(f"管理员不存在：{args.username}")
        user.password_hash = hash_password(password)
        db.commit()

    print(f"管理员 {args.username} 的密码已更新。")


if __name__ == "__main__":
    main()
