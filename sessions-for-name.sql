SELECT
  sessions.name,
  sessions.duration/60000/60 AS hours,
  DATETIME(sessions.start/1000, 'unixepoch'),
  DATETIME(sessions.stop/1000, 'unixepoch'),
  SUBSTR(servers.name, 0, 32)
FROM sessions
INNER JOIN servers ON servers.id = sessions.server
WHERE sessions.name = 'Wolfe'
ORDER BY sessions.start
;
