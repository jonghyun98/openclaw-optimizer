import { getSqlite } from './connection';

const MIGRATIONS = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS metrics_raw (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        model_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        session_id TEXT,
        channel TEXT,
        latency_ms INTEGER,
        ttfb_ms INTEGER,
        input_tokens INTEGER,
        output_tokens INTEGER,
        cache_read_tokens INTEGER,
        cache_write_tokens INTEGER,
        cost_usd REAL,
        success INTEGER NOT NULL,
        error_code TEXT,
        error_message TEXT,
        was_fallback INTEGER NOT NULL DEFAULT 0,
        fallback_from_model TEXT,
        fallback_depth INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_ts ON metrics_raw(ts);
      CREATE INDEX IF NOT EXISTS idx_metrics_model ON metrics_raw(model_id);
      CREATE INDEX IF NOT EXISTS idx_metrics_model_ts ON metrics_raw(model_id, ts);

      CREATE TABLE IF NOT EXISTS metrics_agg_1m (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bucket_ts INTEGER NOT NULL,
        model_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        request_count INTEGER NOT NULL,
        success_count INTEGER NOT NULL,
        error_count INTEGER NOT NULL,
        latency_p50 INTEGER,
        latency_p95 INTEGER,
        latency_p99 INTEGER,
        latency_avg REAL,
        total_input_tokens INTEGER,
        total_output_tokens INTEGER,
        total_cost_usd REAL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_agg1m_bucket_model ON metrics_agg_1m(bucket_ts, model_id);

      CREATE TABLE IF NOT EXISTS fallback_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        from_model TEXT NOT NULL,
        to_model TEXT NOT NULL,
        reason TEXT NOT NULL,
        chain_snapshot TEXT,
        resolved_in_ms INTEGER,
        session_id TEXT,
        channel TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_fallback_ts ON fallback_events(ts);

      CREATE TABLE IF NOT EXISTS model_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        model_id TEXT NOT NULL,
        health_score REAL NOT NULL,
        availability_score REAL,
        latency_score REAL,
        cost_score REAL,
        quality_score REAL,
        error_rate REAL,
        avg_latency_ms REAL,
        rpm REAL,
        is_in_cooldown INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_snap_model_ts ON model_snapshots(model_id, ts);

      CREATE TABLE IF NOT EXISTS cost_daily (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_str TEXT NOT NULL,
        model_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        total_requests INTEGER,
        total_input_tokens INTEGER,
        total_output_tokens INTEGER,
        total_cost_usd REAL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_date_model ON cost_daily(date_str, model_id);

      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        model_id TEXT,
        message TEXT NOT NULL,
        acknowledged INTEGER DEFAULT 0,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
    `,
  },
];

export function runMigrations(): void {
  const sqlite = getSqlite();

  // Ensure migrations table exists
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);

  const applied = new Set(
    sqlite
      .prepare('SELECT version FROM _migrations')
      .all()
      .map((row: any) => row.version)
  );

  for (const migration of MIGRATIONS) {
    if (!applied.has(migration.version)) {
      sqlite.transaction(() => {
        sqlite.exec(migration.sql);
        sqlite.prepare('INSERT INTO _migrations (version, applied_at) VALUES (?, ?)').run(
          migration.version,
          Date.now()
        );
      })();
      console.log(`[DB] Migration v${migration.version} applied`);
    }
  }
}
