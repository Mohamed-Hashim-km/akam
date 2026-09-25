-- Make category column nullable in story table to support Painting and Video submissions without category
ALTER TABLE story ALTER COLUMN category DROP NOT NULL;
