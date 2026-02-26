-- PostgreSQL Database Schema for ServoLeY Platform
-- Run this in PostgreSQL to create the database and tables

-- Create database
CREATE DATABASE servo_ley_platform;

-- Connect to the database
\c servo_ley_platform;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('CUSTOMER', 'PROVIDER')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create providers table
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    provider_type VARCHAR(50),
    service_category VARCHAR(100),
    years_experience INTEGER,
    bio TEXT,
    hourly_rate DECIMAL(10,2),
    business_address TEXT,
    whatsapp VARCHAR(20),
    preferred_method VARCHAR(20) DEFAULT 'call',
    payment_method VARCHAR(20) DEFAULT 'cash',
    upi_id VARCHAR(255),
    pan_number VARCHAR(20),
    aadhaar_number VARCHAR(20),
    profile_image VARCHAR(500),
    agreed_to_terms BOOLEAN DEFAULT FALSE,
    agreed_to_privacy BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_providers_user_id ON providers(user_id);
CREATE INDEX idx_providers_email ON providers(user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO users (user_type, first_name, email, phone, password_hash, is_verified) 
VALUES 
    ('PROVIDER', 'Admin', 'admin@servoley.com', '1234567890', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', true)
ON CONFLICT (email) DO NOTHING;

-- Create admin provider record
INSERT INTO providers (user_id, business_name, provider_type, service_category, years_experience, bio, hourly_rate, agreed_to_terms, agreed_to_privacy)
SELECT 
    id, 
    'Admin Services', 
    'COMPANY', 
    'GENERAL', 
    5, 
    'Platform administrator account', 
    100.00, 
    true, 
    true
FROM users 
WHERE email = 'admin@servoley.com' AND user_type = 'PROVIDER'
ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions (if using specific user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_database_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_database_user;
