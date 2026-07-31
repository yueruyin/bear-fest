from __future__ import annotations

import argparse
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import Boolean, DateTime, create_engine, func, select, text
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import make_url

import app.model  # noqa: F401
from app.database import Base, engine as configured_engine

CONFIRMATION_TEXT = "REPLACE_MYSQL_DATA"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Preview or replace the configured database with data from SQLite."
    )
    parser.add_argument("--source", required=True, help="Path to the source SQLite database.")
    parser.add_argument(
        "--target-url",
        help="Optional SQLAlchemy target URL. Defaults to the configured application database.",
    )
    parser.add_argument(
        "--replace-target",
        action="store_true",
        help="Delete all rows in target application tables, then import SQLite rows.",
    )
    parser.add_argument(
        "--confirm",
        help=f"Required with --replace-target; must equal {CONFIRMATION_TEXT}.",
    )
    return parser.parse_args()


def quote_sqlite_identifier(value: str) -> str:
    return f'"{value.replace(chr(34), chr(34) * 2)}"'


def source_table_names(connection: sqlite3.Connection) -> set[str]:
    rows = connection.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
    ).fetchall()
    return {str(row[0]) for row in rows}


def source_column_names(connection: sqlite3.Connection, table_name: str) -> set[str]:
    quoted_name = quote_sqlite_identifier(table_name)
    rows = connection.execute(f"PRAGMA table_info({quoted_name})").fetchall()
    return {str(row[1]) for row in rows}


def convert_value(value: Any, target_column: Any) -> Any:
    if value is None:
        return None
    if isinstance(target_column.type, Boolean):
        return bool(value)
    if isinstance(target_column.type, DateTime) and isinstance(value, str):
        normalized = value.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    return value


def read_source_rows(
    connection: sqlite3.Connection,
    table: Any,
    available_tables: set[str],
) -> list[dict[str, Any]]:
    if table.name not in available_tables:
        return []

    source_columns = source_column_names(connection, table.name)
    target_columns = [column for column in table.columns if column.name in source_columns]
    missing_required = [
        column.name
        for column in table.columns
        if column.name not in source_columns
        and not column.nullable
        and not column.primary_key
        and column.default is None
        and column.server_default is None
    ]
    if missing_required:
        joined = ", ".join(missing_required)
        raise RuntimeError(f"{table.name} 缺少目标库必填字段：{joined}")
    if not target_columns:
        return []

    selected_columns = ", ".join(
        quote_sqlite_identifier(column.name) for column in target_columns
    )
    quoted_table = quote_sqlite_identifier(table.name)
    cursor = connection.execute(f"SELECT {selected_columns} FROM {quoted_table}")

    result: list[dict[str, Any]] = []
    for source_row in cursor.fetchall():
        result.append(
            {
                column.name: convert_value(source_row[index], column)
                for index, column in enumerate(target_columns)
            }
        )
    return result


def build_target_engine(target_url: str | None) -> Engine:
    if not target_url:
        return configured_engine
    return create_engine(make_url(target_url), pool_pre_ping=True, future=True)


def collect_target_counts(target_engine: Engine) -> dict[str, int]:
    Base.metadata.create_all(bind=target_engine)
    with target_engine.connect() as connection:
        return {
            table.name: int(
                connection.execute(select(func.count()).select_from(table)).scalar_one()
            )
            for table in Base.metadata.sorted_tables
        }


def replace_target(
    target_engine: Engine,
    source_rows: dict[str, list[dict[str, Any]]],
) -> None:
    Base.metadata.create_all(bind=target_engine)
    connection = target_engine.connect()
    transaction = None
    mysql_target = target_engine.dialect.name in {"mysql", "mariadb"}
    try:
        transaction = connection.begin()
        if mysql_target:
            connection.execute(text("SET FOREIGN_KEY_CHECKS=0"))

        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())

        for table in Base.metadata.sorted_tables:
            rows = source_rows[table.name]
            if rows:
                connection.execute(table.insert(), rows)
            print(f"已导入 {table.name}: {len(rows)}")

        transaction.commit()
        transaction = None
    except Exception:
        if transaction is not None:
            transaction.rollback()
        raise
    finally:
        if mysql_target:
            connection.execute(text("SET FOREIGN_KEY_CHECKS=1"))
            connection.commit()
        connection.close()


def main() -> None:
    args = parse_args()
    source_path = Path(args.source).expanduser().resolve()
    if not source_path.is_file():
        raise SystemExit(f"SQLite文件不存在：{source_path}")
    if args.replace_target and args.confirm != CONFIRMATION_TEXT:
        raise SystemExit(
            f"正式导入必须添加 --confirm {CONFIRMATION_TEXT}，当前未修改目标数据库。"
        )

    target_engine = build_target_engine(args.target_url)
    if target_engine.dialect.name == "sqlite":
        target_database = Path(str(target_engine.url.database or "")).resolve()
        if target_database == source_path:
            raise SystemExit("源SQLite和目标数据库不能是同一个文件。")

    source_connection = sqlite3.connect(
        f"file:{source_path}?mode=ro",
        uri=True,
    )
    try:
        available_tables = source_table_names(source_connection)
        source_rows = {
            table.name: read_source_rows(source_connection, table, available_tables)
            for table in Base.metadata.sorted_tables
        }
    finally:
        source_connection.close()

    target_counts = collect_target_counts(target_engine)

    print(f"SQLite源文件：{source_path}")
    print(f"目标数据库：{target_engine.url.render_as_string(hide_password=True)}")
    print()
    print("表名                         SQLite源数据    目标现有数据")
    print("-" * 58)
    for table in Base.metadata.sorted_tables:
        print(
            f"{table.name:<28}"
            f"{len(source_rows[table.name]):>12}"
            f"{target_counts[table.name]:>16}"
        )

    if not args.replace_target:
        print()
        print("当前仅预览，目标数据库没有被修改。")
        return

    print()
    print("开始清空目标业务表并导入SQLite数据……")
    replace_target(target_engine, source_rows)
    final_counts = collect_target_counts(target_engine)

    mismatches = {
        table_name: (len(source_rows[table_name]), final_counts[table_name])
        for table_name in source_rows
        if len(source_rows[table_name]) != final_counts[table_name]
    }
    if mismatches:
        raise RuntimeError(f"迁移后数量核对失败：{mismatches}")
    print("迁移完成，所有表的数据量核对一致。")


if __name__ == "__main__":
    main()
