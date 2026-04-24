-- Move XP and streak source of truth back from user_badges -> users

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1;

-- Backfill users.xp/users.streak from user_badges if those columns still exist there.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_badges'
      AND column_name = 'xp'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_badges'
      AND column_name = 'streak'
  ) THEN
    UPDATE users u
    SET
      xp = COALESCE(ub_stats.xp, u.xp, 0),
      streak = COALESCE(ub_stats.streak, u.streak, 1)
    FROM (
      SELECT
        user_id,
        MAX(COALESCE(xp, 0))::int AS xp,
        MAX(COALESCE(streak, 1))::int AS streak
      FROM user_badges
      GROUP BY user_id
    ) ub_stats
    WHERE ub_stats.user_id = u.id;
  END IF;
END $$;

UPDATE users
SET
  xp = COALESCE(xp, 0),
  streak = COALESCE(streak, 1);

CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);

ALTER TABLE user_badges
  DROP COLUMN IF EXISTS xp,
  DROP COLUMN IF EXISTS streak;
