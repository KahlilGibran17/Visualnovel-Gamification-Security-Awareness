-- Akebono Cyber Academy — Database Schema
-- Run this via: psql -U postgres -f migrations/001_init.sql

-- Create database (run manually first):
-- CREATE DATABASE akebono_cyber_academy;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO roles (name) VALUES ('employee'), ('manager'), ('admin') ON CONFLICT DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nik VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  department VARCHAR(100),
  position VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id) DEFAULT 1,
  avatar_id INTEGER DEFAULT 1,
  display_name VARCHAR(100),
  setup_done BOOLEAN DEFAULT FALSE,
  xp INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 1,
  last_login DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chapter progress
CREATE TABLE IF NOT EXISTS chapter_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  ending VARCHAR(20),
  score INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  wrong_choices INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  UNIQUE(user_id, chapter_id)
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  badge_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  color VARCHAR(20)
);

INSERT INTO badges (badge_key, name, description, icon, color) VALUES
  ('phishing-hunter', 'Phishing Hunter', 'Chapter 1 perfect score', '🎣', '#E63946'),
  ('tidy-desk', 'Tidy Desk', 'Chapter 2 completed', '🗂️', '#3b82f6'),
  ('social-shield', 'Social Shield', 'Chapter 3 completed', '🛡️', '#8b5cf6'),
  ('password-master', 'Password Master', 'Chapter 4 without mistakes', '🔐', '#22c55e'),
  ('first-responder', 'First Responder', 'Chapter 5 completed', '🚨', '#f97316'),
  ('cyber-hero', 'Cyber Hero', 'All chapters good endings', '🦸', '#FFD60A'),
  ('7-day-streak', '7-Day Streak', '7 consecutive logins', '🔥', '#ef4444'),
  ('speed-runner', 'Speed Runner', 'Fastest chapter completion', '⚡', '#06b6d4')
ON CONFLICT DO NOTHING;

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  target VARCHAR(100) DEFAULT 'all',
  message TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_nik ON users(nik);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user ON chapter_progress(user_id);
