-- Professional Merchant Platform Database Schema
-- Like Amazon Sellers, Shopify, etc.

-- Create database
CREATE DATABASE merchant_platform;

-- Connect to database
\c merchant_platform;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (core authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL DEFAULT 'MERCHANT' CHECK (user_type IN ('MERCHANT', 'CUSTOMER', 'ADMIN')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Merchant profiles table
CREATE TABLE merchant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50) NOT NULL, -- 'INDIVIDUAL', 'COMPANY', 'PARTNERSHIP'
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    business_description TEXT,
    website VARCHAR(255),
    founded_year INTEGER,
    employee_count INTEGER,
    annual_revenue DECIMAL(15,2),
    business_category VARCHAR(100),
    sub_categories TEXT[], -- Array of sub-categories
    service_areas TEXT[], -- Array of service areas
    languages_spoken TEXT[],
    business_hours JSONB, -- Store business hours
    response_time_minutes INTEGER DEFAULT 60,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    verification_documents TEXT[], -- Array of document URLs
    profile_image_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    whatsapp VARCHAR(20),
    business_address JSONB,
    billing_address JSONB,
    shipping_addresses JSONB[],
    payment_methods JSONB, -- Array of accepted payment methods
    social_links JSONB, -- Facebook, Instagram, LinkedIn, etc.
    settings JSONB, -- Notification preferences, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    price_type VARCHAR(20) NOT NULL, -- 'FIXED', 'HOURLY', 'PER_ITEM', 'NEGOTIABLE'
    price DECIMAL(10,2),
    price_range JSONB, -- For variable pricing
    duration_minutes INTEGER,
    images TEXT[], -- Array of image URLs
    specifications JSONB, -- Service specifications
    availability JSONB, -- Available times, locations, etc.
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchant_profiles(id),
    service_id UUID REFERENCES services(id),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    location JSONB,
    customer_notes TEXT,
    merchant_notes TEXT,
    pricing JSONB, -- Final pricing details
    payment_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'REFUNDED'
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    cancellation_reason TEXT,
    cancellation_policy JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    customer_id UUID REFERENCES users(id),
    merchant_id UUID REFERENCES merchant_profiles(id),
    service_id UUID REFERENCES services(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT[],
    is_public BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    merchant_response TEXT,
    merchant_response_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merchant analytics table
CREATE TABLE merchant_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchant_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metrics JSONB, -- Views, clicks, bookings, revenue, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    merchant_id UUID REFERENCES merchant_profiles(id),
    customer_id UUID REFERENCES users(id),
    type VARCHAR(20) NOT NULL, -- 'PAYMENT', 'REFUND', 'PAYOUT', 'FEE'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
    payment_method VARCHAR(50),
    gateway VARCHAR(50), -- 'STRIPE', 'PAYPAL', 'BANK_TRANSFER', etc.
    gateway_transaction_id VARCHAR(100),
    fees JSONB, -- Platform fees, payment gateway fees
    net_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Merchant notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'BOOKING', 'REVIEW', 'PAYMENT', 'SYSTEM', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table for JWT management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_merchant_profiles_user_id ON merchant_profiles(user_id);
CREATE INDEX idx_merchant_profiles_business_name ON merchant_profiles(business_name);
CREATE INDEX idx_merchant_profiles_category ON merchant_profiles(business_category);
CREATE INDEX idx_merchant_profiles_verified ON merchant_profiles(is_verified);
CREATE INDEX idx_services_merchant_id ON services(merchant_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_bookings_merchant_id ON bookings(merchant_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(scheduled_at);
CREATE INDEX idx_reviews_merchant_id ON reviews(merchant_id);
CREATE INDEX idx_reviews_service_id ON reviews(service_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(is_read);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchant_profiles_updated_at BEFORE UPDATE ON merchant_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default admin user
INSERT INTO users (email, password_hash, user_type, email_verified, is_active)
VALUES (
    'admin@merchantplatform.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- admin123
    'ADMIN',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample merchant for testing
INSERT INTO users (email, password_hash, user_type, email_verified, phone, is_active)
VALUES (
    'demo@merchant.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.F5e', -- demo123
    'MERCHANT',
    true,
    '+1234567890',
    true
) ON CONFLICT (email) DO NOTHING;

-- Create sample merchant profile
INSERT INTO merchant_profiles (user_id, business_name, business_type, legal_name, business_description, business_category, contact_email, contact_phone, business_address, is_verified, verification_status)
SELECT 
    id,
    'Demo Services Inc.',
    'COMPANY',
    'Demo Services Inc.',
    'Professional service provider with years of experience in quality services.',
    'GENERAL',
    email,
    phone,
    '{"street": "123 Business Ave", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}',
    true,
    'VERIFIED'
FROM users 
WHERE email = 'demo@merchant.com' AND user_type = 'MERCHANT'
ON CONFLICT (user_id) DO NOTHING;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO merchant_platform_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO merchant_platform_user;
