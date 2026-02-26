<?php

class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        $db_path = __DIR__ . '/../data/digitmonie.db';
        $db_dir = dirname($db_path);
        
        if (!is_dir($db_dir)) {
            mkdir($db_dir, 0777, true);
        }

        try {
            $this->connection = new PDO(
                "sqlite:$db_path",
                null,
                null,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
            // Enable WAL mode for better concurrency
            $this->connection->exec('PRAGMA journal_mode=WAL');
            $this->connection->exec('PRAGMA foreign_keys=ON');
            
            // Auto-initialize tables if they don't exist
            $this->initTables();
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }

    private function initTables() {
        $tables = $this->connection->query("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'")->fetchAll();
        if (empty($tables)) {
            $this->connection->exec("
                CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL DEFAULT 'admin',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name VARCHAR(150) NOT NULL,
                    email VARCHAR(100),
                    phone VARCHAR(20) NOT NULL,
                    address TEXT,
                    id_number VARCHAR(50),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS loan_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR(100) NOT NULL,
                    interest_rate DECIMAL(10,2) NOT NULL,
                    interest_period TEXT NOT NULL DEFAULT 'annually',
                    duration_months INTEGER NOT NULL,
                    admin_fee_percent DECIMAL(10,2) NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS loans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_id INTEGER NOT NULL,
                    loan_type_id INTEGER,
                    principal_amount DECIMAL(15,2) NOT NULL,
                    interest_rate DECIMAL(10,2) NOT NULL,
                    interest_period TEXT NOT NULL DEFAULT 'annually',
                    duration_months INTEGER NOT NULL,
                    admin_fee_percent DECIMAL(10,2) NOT NULL DEFAULT 0,
                    admin_fee_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
                    total_interest DECIMAL(15,2) NOT NULL DEFAULT 0,
                    total_repayment DECIMAL(15,2) NOT NULL DEFAULT 0,
                    monthly_payment DECIMAL(15,2) NOT NULL DEFAULT 0,
                    profit DECIMAL(15,2) NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'active',
                    disbursement_date DATE NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                    FOREIGN KEY (loan_type_id) REFERENCES loan_types(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS repayments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    loan_id INTEGER NOT NULL,
                    month_number INTEGER NOT NULL,
                    opening_balance DECIMAL(15,2) NOT NULL,
                    principal_component DECIMAL(15,2) NOT NULL,
                    interest_component DECIMAL(15,2) NOT NULL,
                    closing_balance DECIMAL(15,2) NOT NULL,
                    amount_due DECIMAL(15,2) NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    due_date DATE NOT NULL,
                    paid_date DATE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
                );
            ");

            // Insert default admin (password: admin123)
            $hash = password_hash('admin123', PASSWORD_DEFAULT);
            $stmt = $this->connection->prepare("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
            $stmt->execute(['Admin', 'admin@digitmonie.com', $hash, 'admin']);
        } else {
            // Migration for existing databases: Add role column if missing
            try {
                $columns = $this->connection->query("PRAGMA table_info(admins)")->fetchAll();
                $hasRole = false;
                foreach ($columns as $col) {
                    if ($col['name'] === 'role') {
                        $hasRole = true;
                        break;
                    }
                }
                
                if (!$hasRole) {
                    $this->connection->exec("ALTER TABLE admins ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'admin'");
                }
                
                // Ensure all existing admins have 'admin' role
                $this->connection->exec("UPDATE admins SET role = 'admin' WHERE role IS NULL OR role = ''");
            } catch (PDOException $e) {
                // Silent catch
            }
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}
