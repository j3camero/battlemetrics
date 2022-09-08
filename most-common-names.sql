SELECT
  name,
  count(*) AS frequency
FROM sessions
GROUP BY name
ORDER BY frequency DESC
;
