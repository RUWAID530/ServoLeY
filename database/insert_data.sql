-- Service Marketplace Sample Data

-- Insert sample users
INSERT INTO users (id, email, phone, password_hash, user_type, is_verified, is_active, is_blocked, created_at, updated_at) VALUES
('customer-uuid-12345', 'customer@example.com', '9876543210', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'CUSTOMER', true, true, false, NOW(), NOW()),
('provider-uuid-12345', 'provider@example.com', '9876543211', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PROVIDER', true, true, false, NOW(), NOW());

-- Insert user profiles
INSERT INTO user_profiles (id, user_id, first_name, last_name, address, password_hash, created_at, updated_at) VALUES
('customer-profile-uuid', 'customer-uuid-12345', 'John', 'Doe', '123 Main St, City, State', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW()),
('provider-profile-uuid', 'provider-uuid-12345', 'Jane', 'Smith', '456 Business Ave, City, State', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NOW(), NOW());

-- Insert providers
INSERT INTO providers (id, user_id, business_name, provider_type, category, area, address, pan_number, aadhaar_number, upi_id, is_verified, is_active, rating, total_orders, is_online, created_at, updated_at) VALUES
('provider-details-uuid', 'provider-uuid-12345', 'Smith Home Services', 'FREELANCER', 'Home Cleaning', 'Downtown', '456 Business Ave, City, State', 'ABCDE1234F', '123456789012', 'smith@upi', true, true, 4.5, 25, true, NOW(), NOW());

-- Insert wallets
INSERT INTO wallets (id, user_id, balance, last_updated) VALUES
('customer-wallet-uuid', 'customer-uuid-12345', 1000, NOW()),
('provider-wallet-uuid', 'provider-uuid-12345', 5000, NOW());

-- Insert services
INSERT INTO services (id, provider_id, name, category, description, price, base_price, offer_percent, estimated_time, warranty_months, is_active, created_at, updated_at) VALUES
('service-1-uuid', 'provider-details-uuid', 'Basic Home Cleaning', 'Home Cleaning', 'Complete home cleaning service including dusting, vacuuming, and bathroom cleaning', 1000, 1200, 17, 2, 1, true, NOW(), NOW()),
('service-2-uuid', 'provider-details-uuid', 'Deep Cleaning Service', 'Home Cleaning', 'Deep cleaning service with special attention to kitchen and bathrooms', 2000, 2500, 20, 4, 1, true, NOW(), NOW());

-- Insert orders
INSERT INTO orders (id, customer_id, provider_id, service_id, status, total_amount, payment_status, scheduled_at, completed_at, notes, created_at, updated_at) VALUES
('order-1-uuid', 'customer-uuid-12345', 'provider-details-uuid', 'service-1-uuid', 'COMPLETED', 1000, 'PAID', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', 'Customer requested extra attention to the kitchen', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days');

-- Insert reviews
INSERT INTO reviews (id, order_id, customer_id, provider_id, rating, comment, created_at, updated_at) VALUES
('review-1-uuid', 'order-1-uuid', 'customer-uuid-12345', 'provider-details-uuid', 5, 'Excellent service! The provider was professional and did a thorough job.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Insert transactions
INSERT INTO transactions (id, user_id, order_id, type, amount, description, created_at) VALUES
('transaction-1-uuid', 'customer-uuid-12345', 'order-1-uuid', 'PAYMENT', 1000, 'Payment for Basic Home Cleaning service', NOW() - INTERVAL '7 days'),
('transaction-2-uuid', 'provider-uuid-12345', 'order-1-uuid', 'EARNING', 900, 'Earning from Basic Home Cleaning service', NOW() - INTERVAL '5 days');
