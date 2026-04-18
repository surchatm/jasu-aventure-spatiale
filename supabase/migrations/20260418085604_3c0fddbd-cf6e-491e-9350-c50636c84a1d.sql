
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL CHECK (char_length(player_name) > 0 AND char_length(player_name) <= 20),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100000000),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert a score"
  ON public.leaderboard FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_leaderboard_score_desc ON public.leaderboard (score DESC, created_at ASC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
ALTER TABLE public.leaderboard REPLICA IDENTITY FULL;
