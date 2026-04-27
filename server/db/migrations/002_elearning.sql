-- ======================================================
-- Akebono Cyber Academy — E-Learning Module Migration
-- Jalankan setelah 001_init.sql
-- ======================================================

-- ---------------------------------------------------------
-- 1. TABEL UTAMA: elearning_lessons
--    Satu chapter = satu video (UNIQUE chapter_id)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS elearning_lessons (
  id               SERIAL       PRIMARY KEY,
  chapter_id       INTEGER      NOT NULL UNIQUE,           -- 1 chapter = 1 video
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  video_url        TEXT         NOT NULL,                  -- YouTube URL / direct video URL
  thumbnail_url    TEXT,                                   -- URL thumbnail (opsional)
  duration_seconds INTEGER      DEFAULT 0,                 -- Durasi video dalam detik
  xp_reward        INTEGER      DEFAULT 100,               -- XP bonus setelah menonton habis
  is_active        BOOLEAN      DEFAULT TRUE,
  created_at       TIMESTAMP    DEFAULT NOW(),
  updated_at       TIMESTAMP    DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 2. TABEL PERTANYAAN: elearning_questions
--    Satu video bisa punya banyak pertanyaan (muncul di timestamp tertentu)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS elearning_questions (
  id               SERIAL   PRIMARY KEY,
  lesson_id        INTEGER  NOT NULL REFERENCES elearning_lessons(id) ON DELETE CASCADE,
  question_text    TEXT     NOT NULL,
  timestamp_seconds INTEGER NOT NULL,                      -- Detik ke-berapa video di-pause dan soal muncul
  xp_reward        INTEGER  DEFAULT 25,                    -- XP jika menjawab benar
  order_index      INTEGER  DEFAULT 0,                     -- Urutan tampil
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ---------------------------------------------------------
-- 3. TABEL PILIHAN JAWABAN: elearning_options
--    Setiap pertanyaan punya beberapa pilihan, satu yang benar
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS elearning_options (
  id           SERIAL   PRIMARY KEY,
  question_id  INTEGER  NOT NULL REFERENCES elearning_questions(id) ON DELETE CASCADE,
  option_text  TEXT     NOT NULL,
  is_correct   BOOLEAN  DEFAULT FALSE,
  order_index  INTEGER  DEFAULT 0
);

-- ---------------------------------------------------------
-- 4. TABEL PROGRESS USER: elearning_progress
--    Menyimpan seberapa jauh user menonton video & apakah selesai
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS elearning_progress (
  id                  SERIAL    PRIMARY KEY,
  user_id             INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id           INTEGER   NOT NULL REFERENCES elearning_lessons(id) ON DELETE CASCADE,
  watch_time_seconds  INTEGER   DEFAULT 0,                 -- Detik terakhir yang ditonton
  completed           BOOLEAN   DEFAULT FALSE,
  xp_earned           INTEGER   DEFAULT 0,                 -- Total XP dari video + kuis
  completed_at        TIMESTAMP,
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ---------------------------------------------------------
-- 5. TABEL JAWABAN USER: elearning_answers
--    Menyimpan pilihan jawaban user untuk setiap pertanyaan kuis
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS elearning_answers (
  id                 SERIAL    PRIMARY KEY,
  user_id            INTEGER   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id        INTEGER   NOT NULL REFERENCES elearning_questions(id) ON DELETE CASCADE,
  selected_option_id INTEGER   REFERENCES elearning_options(id),
  is_correct         BOOLEAN   DEFAULT FALSE,
  answered_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, question_id)                             -- 1 user hanya boleh jawab 1x per soal
);

-- ---------------------------------------------------------
-- INDEXES untuk performa query
-- ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_elearning_lessons_chapter    ON elearning_lessons(chapter_id);
CREATE INDEX IF NOT EXISTS idx_elearning_lessons_active     ON elearning_lessons(is_active);
CREATE INDEX IF NOT EXISTS idx_elearning_questions_lesson   ON elearning_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_elearning_questions_ts       ON elearning_questions(timestamp_seconds);
CREATE INDEX IF NOT EXISTS idx_elearning_options_question   ON elearning_options(question_id);
CREATE INDEX IF NOT EXISTS idx_elearning_progress_user      ON elearning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_elearning_progress_lesson    ON elearning_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_elearning_answers_user       ON elearning_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_elearning_answers_question   ON elearning_answers(question_id);

-- ---------------------------------------------------------
-- SEED DATA: Lesson Chapter 1 — Phishing Awareness
-- (Gunakan DO block agar bisa referensikan ID yang baru dibuat)
-- ---------------------------------------------------------
DO $$
DECLARE
  v_lesson_id  INTEGER;
  v_q1_id      INTEGER;
  v_q2_id      INTEGER;
  v_q3_id      INTEGER;
BEGIN

  -- Insert lesson Chapter 1
  INSERT INTO elearning_lessons (chapter_id, title, description, video_url, thumbnail_url, duration_seconds, xp_reward)
  VALUES (
    1,
    'Mengenal dan Menghindari Phishing',
    'Pelajari cara mengenali email phishing, link berbahaya, dan teknik social engineering yang sering digunakan penyerang untuk mencuri data pribadi dan kredensial organisasi.',
    'https://www.youtube.com/watch?v=XBkzBrXlle0',
    NULL,
    600,
    150
  )
  ON CONFLICT (chapter_id) DO NOTHING;

  SELECT id INTO v_lesson_id FROM elearning_lessons WHERE chapter_id = 1;
  IF v_lesson_id IS NULL THEN RETURN; END IF;

  -- Hanya tambahkan pertanyaan jika belum ada
  IF NOT EXISTS (SELECT 1 FROM elearning_questions WHERE lesson_id = v_lesson_id) THEN

    -- Pertanyaan 1: muncul di detik ke-120
    INSERT INTO elearning_questions (lesson_id, question_text, timestamp_seconds, xp_reward, order_index)
    VALUES (v_lesson_id, 'Apa yang harus Anda lakukan jika menerima email dari alamat yang mencurigakan dan meminta data pribadi?', 120, 25, 1)
    RETURNING id INTO v_q1_id;

    INSERT INTO elearning_options (question_id, option_text, is_correct, order_index) VALUES
      (v_q1_id, 'Langsung membalas email dan memberikan data yang diminta', FALSE, 1),
      (v_q1_id, 'Tidak mengklik link apapun dan segera melaporkan ke tim IT', TRUE,  2),
      (v_q1_id, 'Meneruskan email ke rekan kerja untuk dikonfirmasi bersama', FALSE, 3),
      (v_q1_id, 'Mengabaikan email tanpa perlu melaporkannya ke siapapun', FALSE, 4);

    -- Pertanyaan 2: muncul di detik ke-300
    INSERT INTO elearning_questions (lesson_id, question_text, timestamp_seconds, xp_reward, order_index)
    VALUES (v_lesson_id, 'Mana dari berikut ini yang merupakan tanda-tanda khas dari email phishing?', 300, 25, 2)
    RETURNING id INTO v_q2_id;

    INSERT INTO elearning_options (question_id, option_text, is_correct, order_index) VALUES
      (v_q2_id, 'Email dikirim dari domain resmi perusahaan dengan format yang benar', FALSE, 1),
      (v_q2_id, 'Alamat email pengirim mencurigakan disertai ejaan dan tata bahasa yang buruk', TRUE, 2),
      (v_q2_id, 'Email tanpa lampiran yang dikirim oleh pengirim yang sudah dikenal', FALSE, 3),
      (v_q2_id, 'Notifikasi rutin dari sistem internal yang sudah dikonfigurasi sebelumnya', FALSE, 4);

    -- Pertanyaan 3: muncul di detik ke-480
    INSERT INTO elearning_questions (lesson_id, question_text, timestamp_seconds, xp_reward, order_index)
    VALUES (v_lesson_id, 'Apa langkah pertama yang harus dilakukan jika Anda tidak sengaja mengklik link phishing?', 480, 30, 3)
    RETURNING id INTO v_q3_id;

    INSERT INTO elearning_options (question_id, option_text, is_correct, order_index) VALUES
      (v_q3_id, 'Menunggu dan melihat apakah ada hal mencurigakan yang terjadi', FALSE, 1),
      (v_q3_id, 'Segera memutuskan koneksi internet dan melaporkan kejadian ke tim IT', TRUE, 2),
      (v_q3_id, 'Menginstal ulang sistem operasi secara mandiri tanpa memberi tahu IT', FALSE, 3),
      (v_q3_id, 'Hanya membersihkan history dan cache browser saja', FALSE, 4);

  END IF;

END $$;
