SELECT
  id,
  est_daily_sessions * (JULIANDAY('now') - JULIANDAY(most_recent_session_crawl_time)) AS est_new_sessions,
  SUBSTR(name, 0, 32) AS abbrev_name
FROM servers
WHERE est_daily_sessions IS NOT NULL
AND server_details_update_time IS NOT NULL
AND JULIANDAY('now') - JULIANDAY(server_details_update_time) < 7
ORDER BY est_new_sessions DESC
LIMIT 10
;
