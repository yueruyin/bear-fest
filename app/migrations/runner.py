from __future__ import annotations

import argparse
from datetime import datetime, timezone

from sqlalchemy import Engine, inspect, text

from app.database import engine as default_engine

CASE_CONTENT_MIGRATION = "20260812_01_case_content"
CASE_CONTENT_COLUMNS = {
    "project_background": "TEXT NULL",
    "project_goals": "TEXT NULL",
    "execution_highlights": "TEXT NULL",
    "result_metrics": "TEXT NULL",
    "result_summary": "TEXT NULL",
}


def _quote(engine: Engine, identifier: str) -> str:
    return engine.dialect.identifier_preparer.quote(identifier)


def _add_column_sql(engine: Engine, name: str) -> str:
    return (
        f"ALTER TABLE {_quote(engine, 'cases')} ADD COLUMN "
        f"{_quote(engine, name)} {CASE_CONTENT_COLUMNS[name]}"
    )


def _drop_column_sql(engine: Engine, name: str) -> str:
    return (
        f"ALTER TABLE {_quote(engine, 'cases')} DROP COLUMN {_quote(engine, name)}"
    )


def _table_names(engine: Engine) -> set[str]:
    return set(inspect(engine).get_table_names())


def _case_columns(engine: Engine) -> set[str]:
    if "cases" not in _table_names(engine):
        return set()
    return {column["name"] for column in inspect(engine).get_columns("cases")}


def _ensure_history_table(engine: Engine) -> None:
    version_type = "VARCHAR(128)" if engine.dialect.name == "mysql" else "TEXT"
    applied_type = "DATETIME(6)" if engine.dialect.name == "mysql" else "TEXT"
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE IF NOT EXISTS schema_migrations ("
                f"version {version_type} PRIMARY KEY, "
                f"applied_at {applied_type} NOT NULL"
                ")"
            )
        )


def _record_migration(engine: Engine) -> None:
    with engine.begin() as connection:
        existing = connection.execute(
            text("SELECT version FROM schema_migrations WHERE version = :version"),
            {"version": CASE_CONTENT_MIGRATION},
        ).first()
        if not existing:
            connection.execute(
                text(
                    "INSERT INTO schema_migrations (version, applied_at) "
                    "VALUES (:version, :applied_at)"
                ),
                {
                    "version": CASE_CONTENT_MIGRATION,
                    "applied_at": datetime.now(timezone.utc).replace(tzinfo=None),
                },
            )


def apply_migrations(engine: Engine = default_engine) -> list[str]:
    """Apply all known migrations and return the columns added in this run."""
    _ensure_history_table(engine)
    existing = _case_columns(engine)
    if not existing:
        return []

    added: list[str] = []
    for name in CASE_CONTENT_COLUMNS:
        if name in existing:
            continue
        with engine.begin() as connection:
            connection.execute(
                text(_add_column_sql(engine, name))
            )
        added.append(name)
        existing.add(name)

    verify_case_content_migration(engine)
    _record_migration(engine)
    return added


def verify_case_content_migration(engine: Engine = default_engine) -> None:
    missing = set(CASE_CONTENT_COLUMNS) - _case_columns(engine)
    if missing:
        raise RuntimeError(
            "case content migration is incomplete; missing columns: "
            + ", ".join(sorted(missing))
        )


def rollback_case_content_migration(engine: Engine = default_engine) -> list[str]:
    """Drop Issue #2 columns. Restore the pre-migration backup to recover their data."""
    existing = _case_columns(engine)
    if not existing:
        return []

    removed: list[str] = []
    for name in reversed(tuple(CASE_CONTENT_COLUMNS)):
        if name not in existing:
            continue
        with engine.begin() as connection:
            connection.execute(
                text(_drop_column_sql(engine, name))
            )
        removed.append(name)

    _ensure_history_table(engine)
    with engine.begin() as connection:
        connection.execute(
            text("DELETE FROM schema_migrations WHERE version = :version"),
            {"version": CASE_CONTENT_MIGRATION},
        )
    return removed


def main() -> None:
    parser = argparse.ArgumentParser(description="Bear Fest database migrations")
    parser.add_argument(
        "action", choices=("apply", "verify", "rollback"), nargs="?", default="apply"
    )
    args = parser.parse_args()
    if args.action == "apply":
        added = apply_migrations()
        print(f"{CASE_CONTENT_MIGRATION}: applied ({len(added)} columns added)")
    elif args.action == "verify":
        verify_case_content_migration()
        print(f"{CASE_CONTENT_MIGRATION}: verified")
    else:
        removed = rollback_case_content_migration()
        print(f"{CASE_CONTENT_MIGRATION}: rolled back ({len(removed)} columns removed)")


if __name__ == "__main__":
    main()
