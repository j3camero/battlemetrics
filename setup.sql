CREATE TABLE IF NOT EXISTS sessions (
  uuid TEXT PRIMARY KEY,
  server INTEGER NOT NULL,
  name TEXT NOT NULL,
  start INTEGER NOT NULL,
  stop INTEGER DEFAULT NULL,
  duration INTEGER DEFAULT 0
);

CREATE INDEX server_start on sessions (server, start);
