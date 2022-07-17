CREATE TABLE servers (
  id INTEGER PRIMARY KEY,
  name TEXT,
  last_known_rank INTEGER,
  server_details_update_time TEXT,
  most_recent_session_crawl_time TEXT,
  est_daily_sessions REAL
);

CREATE TABLE sessions (
  uuid TEXT PRIMARY KEY,
  server INTEGER NOT NULL,
  name TEXT NOT NULL,
  start INTEGER NOT NULL,
  stop INTEGER DEFAULT NULL,
  duration INTEGER DEFAULT 0
);

CREATE INDEX server_start on sessions (server, start);
