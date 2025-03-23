-- Create scoring_templates table
CREATE TABLE IF NOT EXISTS scoring_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  categories JSONB NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  overall_score INTEGER
);

-- Add RLS policies
ALTER TABLE scoring_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own templates
CREATE POLICY "Users can view their own templates"
  ON scoring_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own templates
CREATE POLICY "Users can insert their own templates"
  ON scoring_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own templates
CREATE POLICY "Users can update their own templates"
  ON scoring_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own templates
CREATE POLICY "Users can delete their own templates"
  ON scoring_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS scoring_templates_user_id_idx ON scoring_templates (user_id);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_scoring_templates_updated_at
BEFORE UPDATE ON scoring_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 