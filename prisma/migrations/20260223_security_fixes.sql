-- Create refresh token session store
CREATE TABLE IF NOT EXISTS auth_refresh_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jti TEXT NOT NULL UNIQUE,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  rotated_to_jti TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_refresh_sessions_user_idx ON auth_refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS auth_refresh_sessions_exp_idx ON auth_refresh_sessions(expires_at);

-- Add token version for immediate invalidation
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;

-- Enforce one default active payout method
CREATE UNIQUE INDEX IF NOT EXISTS user_payment_methods_one_default_uq
ON user_payment_methods(userId)
WHERE isDefault = true AND isActive = true;
