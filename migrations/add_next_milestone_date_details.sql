-- Migration: Add next_milestone_date_details column to persons table
-- Date: 2025-11-03
-- Description: Adds a column to store milestone details for filtering functionality

BEGIN;

-- Add the next_milestone_date_details column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='persons' AND column_name='next_milestone_date_details') THEN
        ALTER TABLE persons ADD COLUMN next_milestone_date_details VARCHAR(255);
        RAISE NOTICE 'Column next_milestone_date_details added to persons table';
    ELSE
        RAISE NOTICE 'Column next_milestone_date_details already exists in persons table';
    END IF;
END $$;

COMMIT;