# Issue #2 案例复盘字段迁移与数据核对

本迁移为 `cases` 增加以下可空字段，保证旧数据可继续读取：

- `project_background`
- `project_goals`
- `execution_highlights`
- `result_metrics`
- `result_summary`

迁移版本为 `20260812_01_case_content`。应用启动时会在 `create_all()` 之后显式执行
版本化迁移；`create_all()` 本身不会被当作已有表的迁移方案。

## 上线步骤

### SQLite

1. 停止写入并备份数据库：`cp app.db app.db.before-issue-2`。
2. 执行迁移：`python3 -m app.migrations.runner apply`。
3. 验证迁移：`python3 -m app.migrations.runner verify`。
4. 用 `sqlite3 app.db 'PRAGMA table_info(cases);'` 核对五个新字段。
5. 抽查迁移前后的案例总数、`id`、`slug` 与发布状态一致。

### MySQL 8.4

1. 执行 `deploy/scripts/backup.sh`，记录生成的备份文件路径并暂停后台写入。
2. 在后端容器中执行：
   `docker compose --env-file .env -f compose.yaml exec backend python -m app.migrations.runner apply`。
3. 执行同一命令并将末尾动作改为 `verify`。
4. 通过 `SHOW COLUMNS FROM cases;` 核对五个新字段，并对比迁移前后的案例数量、
   `id`、`slug`、`publish_status`。
5. 启动新版本后，在后台保存一条草稿，确认新增 JSON 字段可以往返读取。

迁移可重复执行；已存在的字段不会重复添加，版本写入 `schema_migrations`。

## 历史数据核对

上线前由业务负责人逐条核对所有 `published` 案例，并在发布清单中标记：

- `已回填`：项目背景、目标和执行亮点已经核实并填写；成果指标仅填写有来源的数据。
- `批准最小展示`：仅展示标题、摘要、封面、标签和已有图集。

后台允许已发布的“批准最小展示”案例在复盘字段保持原值时保存基础内容；新建发布、
草稿转发布或修改复盘字段仍须满足完整性校验。

固定 WTT 报告内容不得按 `event_type` 回填。只有业务负责人确认对应案例、指标口径与
数据来源后，才可将该内容手工填写到那一条案例。核对完成前，建议把未批准的历史案例
改为草稿。

## 回滚

首选回滚方式是停止写入并恢复迁移前的完整数据库备份，这样可以保留新字段写入前的
一致状态。若确认不需要保留五个新字段中的数据，可在回退应用版本前执行：

`python3 -m app.migrations.runner rollback`

该命令会删除五个字段及迁移版本记录，字段内数据不可恢复。MySQL DDL 可能自动提交，
因此执行前必须有可用备份；任何一步失败时应停止操作并从备份恢复，不要继续运行旧版
应用。
