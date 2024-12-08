-- Count total properties
SELECT council, COUNT(*) as property_count 
FROM properties 
GROUP BY council;

-- Sample some properties
SELECT * FROM properties 
WHERE council = 'RYDE' 
LIMIT 5;
