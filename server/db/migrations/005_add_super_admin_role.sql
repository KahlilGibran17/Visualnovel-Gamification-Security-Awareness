-- Ensure super-admin role exists for dedicated dashboard access.

INSERT INTO roles (name)
VALUES ('super-admin')
ON CONFLICT (name) DO NOTHING;
