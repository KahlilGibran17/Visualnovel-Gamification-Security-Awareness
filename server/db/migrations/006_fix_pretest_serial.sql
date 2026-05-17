-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: Make pq_id and po_id auto-increment (SERIAL)
-- Run this if your pretest_questions/pretest_options tables were created
-- with plain INTEGER instead of SERIAL primary keys.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Fix pretest_questions.pq_id
CREATE SEQUENCE IF NOT EXISTS pretest_questions_pq_id_seq
    OWNED BY pretest_questions.pq_id;

SELECT setval('pretest_questions_pq_id_seq', COALESCE((SELECT MAX(pq_id) FROM pretest_questions), 0) + 1, false);

ALTER TABLE pretest_questions
    ALTER COLUMN pq_id SET DEFAULT nextval('pretest_questions_pq_id_seq'),
    ALTER COLUMN pq_id SET NOT NULL;

-- 2) Fix pretest_options.po_id
CREATE SEQUENCE IF NOT EXISTS pretest_options_po_id_seq
    OWNED BY pretest_options.po_id;

SELECT setval('pretest_options_po_id_seq', COALESCE((SELECT MAX(po_id) FROM pretest_options), 0) + 1, false);

ALTER TABLE pretest_options
    ALTER COLUMN po_id SET DEFAULT nextval('pretest_options_po_id_seq'),
    ALTER COLUMN po_id SET NOT NULL;
