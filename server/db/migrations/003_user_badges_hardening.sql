-- Move XP and streak source of truth from users -> user_badges

ALTER TABLE user_badges
	ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
	ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1;

-- Backfill existing badge rows from users values.
UPDATE user_badges ub
SET
	xp = COALESCE(u.xp, 0),
	streak = COALESCE(u.streak, 1)
FROM users u
WHERE u.id = ub.user_id
	AND (ub.xp IS NULL OR ub.streak IS NULL);

-- Ensure each user has at least one row in user_badges to store current XP/streak,
-- even before earning any real badge.
INSERT INTO user_badges (user_id, badge_id, xp, streak, earned_at)
SELECT u.id, NULL, COALESCE(u.xp, 0), COALESCE(u.streak, 1), NOW()
FROM users u
WHERE NOT EXISTS (
	SELECT 1
	FROM user_badges ub
	WHERE ub.user_id = u.id
);

DROP INDEX IF EXISTS idx_users_xp;

ALTER TABLE users
	DROP COLUMN IF EXISTS xp,
	DROP COLUMN IF EXISTS streak;
