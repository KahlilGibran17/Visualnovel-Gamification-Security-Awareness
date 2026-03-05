-- Akebono Cyber Academy — Demo Seed Data
-- Run AFTER migrations/001_init.sql

-- Clear existing data
TRUNCATE users CASCADE;

-- Insert demo users with bcrypt hashes for 'password123' and 'admin123'
-- These hashes are pre-computed (password123 = $2a$12$... etc)
-- You need to run the Node seed script instead for real bcrypt hashes

-- Use the Node.js seed script: node db/seed.js
SELECT 'Please run: node db/seed.js instead for proper bcrypt password hashing' as message;
