-- DigitMonie Records - Loan Management System
-- Database Schema

CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    id_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    interest_rate DECIMAL(10,2) NOT NULL,
    interest_period ENUM('monthly','annually') NOT NULL DEFAULT 'annually',
    duration_months INT NOT NULL,
    admin_fee_percent DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    loan_type_id INT,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(10,2) NOT NULL,
    interest_period ENUM('monthly','annually') NOT NULL DEFAULT 'annually',
    duration_months INT NOT NULL,
    admin_fee_percent DECIMAL(10,2) NOT NULL DEFAULT 0,
    admin_fee_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_interest DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_repayment DECIMAL(15,2) NOT NULL DEFAULT 0,
    monthly_payment DECIMAL(15,2) NOT NULL DEFAULT 0,
    profit DECIMAL(15,2) NOT NULL DEFAULT 0,
    status ENUM('active','completed','defaulted') NOT NULL DEFAULT 'active',
    disbursement_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (loan_type_id) REFERENCES loan_types(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS repayments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    month_number INT NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    principal_component DECIMAL(15,2) NOT NULL,
    interest_component DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    amount_due DECIMAL(15,2) NOT NULL,
    status ENUM('pending','paid','overdue') NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
);

-- Default admin account (password: admin123)
INSERT INTO admins (name, email, password_hash) VALUES 
('Admin', 'admin@digitmonie.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
