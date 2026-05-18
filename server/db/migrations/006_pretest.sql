-- ═══════════════════════════════════════════════════════════════════════════
-- 006_pretest.sql — Pre-test tables (questions, options, user attempts)
-- ═══════════════════════════════════════════════════════════════════════════

-- Table: pretest_questions (already exists from screenshot)
-- pq_id       SERIAL PRIMARY KEY
-- ch_id       INT REFERENCES chapters(ch_id)
-- pq_number   INT
-- pq_text     VARCHAR
-- created_at  DATE

-- Table: pretest_options (already exists from screenshot)
-- po_id       SERIAL PRIMARY KEY
-- pq_id       INT REFERENCES pretest_questions(pq_id)
-- po_text     VARCHAR(255)
-- is_correct  BOOLEAN

-- ─── New: Track user pre-test attempts ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS pretest_attempts (
    pa_id        SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ch_id        INT NOT NULL REFERENCES chapters(ch_id) ON DELETE CASCADE,
    total_questions INT NOT NULL DEFAULT 0,
    correct_count   INT NOT NULL DEFAULT 0,
    wrong_count     INT NOT NULL DEFAULT 0,
    completed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, ch_id)
);

-- ─── New: Track individual user answers per attempt ────────────────────────
CREATE TABLE IF NOT EXISTS pretest_user_answers (
    pua_id       SERIAL PRIMARY KEY,
    user_id      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pq_id        INT NOT NULL REFERENCES pretest_questions(pq_id) ON DELETE CASCADE,
    selected_po_id INT NOT NULL REFERENCES pretest_options(po_id) ON DELETE CASCADE,
    is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, pq_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pretest_attempts_user_ch ON pretest_attempts(user_id, ch_id);
CREATE INDEX IF NOT EXISTS idx_pretest_user_answers_user ON pretest_user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_pretest_user_answers_pq ON pretest_user_answers(pq_id);
