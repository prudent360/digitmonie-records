<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class SettingsController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->ensureTable();
    }

    private function ensureTable() {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ");
    }

    // GET /settings — public (no auth required for logo)
    public function index() {
        $stmt = $this->db->query("SELECT key, value FROM settings");
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['key']] = $row['value'];
        }

        return ['settings' => $settings];
    }

    // PUT /settings — admin only
    public function update() {
        Auth::isAdmin();

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data)) {
            http_response_code(400);
            return ['error' => 'No data provided'];
        }

        $allowed_keys = ['logo', 'brand_name'];

        $stmt = $this->db->prepare("
            INSERT INTO settings (key, value, updated_at) 
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
        ");

        foreach ($data as $key => $value) {
            if (in_array($key, $allowed_keys)) {
                // Validate logo size (max ~500KB base64)
                if ($key === 'logo' && strlen($value) > 700000) {
                    http_response_code(400);
                    return ['error' => 'Logo file is too large. Maximum size is 500KB.'];
                }
                $stmt->execute([$key, $value]);
            }
        }

        return ['message' => 'Settings updated successfully'];
    }
}
