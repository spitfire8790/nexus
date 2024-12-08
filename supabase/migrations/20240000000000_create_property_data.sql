-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS http;

-- Create the properties table
CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    prop_id INTEGER NOT NULL,
    council VARCHAR(100) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prop_id, council)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_council ON properties(council);

-- Debug log table
CREATE TABLE IF NOT EXISTS refresh_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    council TEXT,
    message TEXT,
    details JSONB
);

-- Function to URL encode a string
CREATE OR REPLACE FUNCTION url_encode(data text) RETURNS text LANGUAGE sql AS $$
    SELECT replace(
        replace(
            replace(
                replace(
                    replace(data,
                        '+', '%2B'),
                    ' ', '%20'),
                '=', '%3D'),
            '&', '%26'),
        '''', '%27');
$$;

-- Function to refresh property data for a council
CREATE OR REPLACE FUNCTION refresh_council_properties(council_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    total_count INTEGER := 0;
    batch_size INTEGER := 1000;
    current_offset INTEGER := 0;
    api_url TEXT;
    api_response JSONB;
    properties_array JSONB;
    inserted_count INTEGER;
    features_count INTEGER;
    total_inserted INTEGER := 0;
BEGIN
    -- Validate input
    IF council_name IS NULL OR council_name = '' THEN
        RAISE EXCEPTION 'Council name cannot be null or empty';
    END IF;

    -- Delete existing records for this council
    DELETE FROM properties WHERE council = council_name;
    
    -- Keep fetching while we get full batches or until first batch
    LOOP
        -- Construct URL with current offset
        api_url := concat_ws('',
            'https://mapprod3.environment.nsw.gov.au/arcgis/rest/services/Common/AddressSearch/MapServer/6/query',
            '?where=COUNCIL=''', url_encode(council_name), '''',
            '&outFields=PROPID',
            '&returnGeometry=false',
            '&resultOffset=', current_offset::text,
            '&resultRecordCount=', batch_size::text,
            '&f=json'
        );

        -- Log the URL we're about to call
        INSERT INTO refresh_logs (council, message, details) 
        VALUES (council_name, 'Attempting API call', jsonb_build_object('url', api_url));

        -- Validate URL before making request
        IF api_url IS NULL OR length(api_url) < 10 THEN
            RAISE EXCEPTION 'Invalid API URL constructed: %', api_url;
        END IF;
        
        -- Get batch of properties
        SELECT content::jsonb INTO api_response 
        FROM http((
            'GET',
            api_url,
            ARRAY[('Content-Type', 'application/json')]::http_header[],
            NULL,
            NULL
        )::http_request);

        -- Log the response
        INSERT INTO refresh_logs (council, message, details) 
        VALUES (council_name, 'API response received', api_response);
        
        -- Get the features array
        properties_array := api_response->'features';
        
        -- Count features in this batch
        features_count := jsonb_array_length(properties_array);
        
        -- Insert properties from this batch
        WITH inserted AS (
            INSERT INTO properties (prop_id, council)
            SELECT DISTINCT 
                (value->'attributes'->>'PROPID')::integer,
                council_name
            FROM jsonb_array_elements(properties_array)
            WHERE value->'attributes'->>'PROPID' IS NOT NULL
            RETURNING prop_id
        )
        SELECT COUNT(*) INTO inserted_count FROM inserted;
        
        -- Add to total
        total_inserted := total_inserted + inserted_count;
        
        -- Break if we got fewer records than requested (last batch)
        IF features_count < batch_size THEN
            EXIT;
        END IF;
        
        -- Move to next batch
        current_offset := current_offset + features_count;
        
        -- Small delay to avoid overwhelming the API
        PERFORM pg_sleep(0.2);
    END LOOP;
    
    RETURN total_inserted;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all councils
CREATE OR REPLACE FUNCTION refresh_all_properties()
RETURNS TABLE (council TEXT, count INTEGER) AS $$
DECLARE
    council_name TEXT;
BEGIN
    FOR council_name IN 
        SELECT DISTINCT council FROM properties
    LOOP
        RETURN QUERY 
        SELECT 
            council_name,
            refresh_council_properties(council_name)
        WHERE council_name IS NOT NULL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Clear existing data
TRUNCATE TABLE properties CASCADE;
TRUNCATE TABLE refresh_logs CASCADE;

-- Initial data population for common councils
INSERT INTO properties (prop_id, council) VALUES (-1, 'RYDE')
ON CONFLICT DO NOTHING;

-- Trigger initial refresh
SELECT refresh_council_properties('RYDE');

-- View logs
SELECT timestamp, message, details::text 
FROM refresh_logs 
ORDER BY timestamp DESC 
LIMIT 10;
