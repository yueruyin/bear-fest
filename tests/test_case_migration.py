from sqlalchemy import create_engine, create_mock_engine, inspect, text

from app.migrations.runner import (
    CASE_CONTENT_COLUMNS,
    CASE_CONTENT_MIGRATION,
    _add_column_sql,
    _drop_column_sql,
    apply_migrations,
    rollback_case_content_migration,
    verify_case_content_migration,
)


def test_sqlite_existing_data_migrates_and_rolls_back(tmp_path) -> None:
    database_path = tmp_path / "legacy.db"
    engine = create_engine(f"sqlite:///{database_path}")
    with engine.begin() as connection:
        connection.execute(
            text("CREATE TABLE cases (id INTEGER PRIMARY KEY, title TEXT NOT NULL)")
        )
        connection.execute(
            text("INSERT INTO cases (id, title) VALUES (7, 'legacy case')")
        )

    assert apply_migrations(engine) == list(CASE_CONTENT_COLUMNS)
    verify_case_content_migration(engine)
    assert apply_migrations(engine) == []
    assert set(CASE_CONTENT_COLUMNS) <= {
        column["name"] for column in inspect(engine).get_columns("cases")
    }
    with engine.connect() as connection:
        assert connection.execute(text("SELECT title FROM cases WHERE id = 7")).scalar_one() == "legacy case"
        assert connection.execute(
            text("SELECT version FROM schema_migrations")
        ).scalar_one() == CASE_CONTENT_MIGRATION

    removed = rollback_case_content_migration(engine)
    assert set(removed) == set(CASE_CONTENT_COLUMNS)
    assert not (set(CASE_CONTENT_COLUMNS) & {
        column["name"] for column in inspect(engine).get_columns("cases")
    })
    with engine.connect() as connection:
        assert connection.execute(text("SELECT title FROM cases WHERE id = 7")).scalar_one() == "legacy case"


def test_mysql_ddl_is_compatible_with_existing_rows() -> None:
    mysql_engine = create_mock_engine("mysql+pymysql://", lambda *args, **kwargs: None)
    for column in CASE_CONTENT_COLUMNS:
        assert _add_column_sql(mysql_engine, column) == (
            f"ALTER TABLE cases ADD COLUMN {column} TEXT NULL"
        )
        assert _drop_column_sql(mysql_engine, column) == (
            f"ALTER TABLE cases DROP COLUMN {column}"
        )
