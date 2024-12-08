-- View the logs to see what happened
SELECT timestamp, message, details::text
FROM refresh_logs 
ORDER BY timestamp DESC 
LIMIT 10;
