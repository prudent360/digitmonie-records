<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class LoanTypeController {

    public function index() {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT * FROM loan_types ORDER BY created_at DESC");
        return ['loan_types' => $stmt->fetchAll()];
    }

    public function show($id) {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM loan_types WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $type = $stmt->fetch();

        if (!$type) {
            http_response_code(404);
            return ['error' => 'Loan type not found'];
        }

        return ['loan_type' => $type];
    }

    public function store() {
        Auth::getAuthenticatedAdmin();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || !isset($data['interest_rate']) || empty($data['duration_months'])) {
            http_response_code(400);
            return ['error' => 'Name, interest rate, and duration are required'];
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO loan_types (name, interest_rate, interest_period, duration_months, admin_fee_percent) VALUES (:name, :interest_rate, :interest_period, :duration_months, :admin_fee_percent)");
        $stmt->execute([
            'name' => $data['name'],
            'interest_rate' => $data['interest_rate'],
            'interest_period' => $data['interest_period'] ?? 'annually',
            'duration_months' => $data['duration_months'],
            'admin_fee_percent' => $data['admin_fee_percent'] ?? 0
        ]);

        $id = $db->lastInsertId();
        http_response_code(201);
        return ['message' => 'Loan type created successfully', 'id' => $id];
    }

    public function update($id) {
        Auth::getAuthenticatedAdmin();
        $data = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance()->getConnection();

        $check = $db->prepare("SELECT id FROM loan_types WHERE id = :id");
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
            http_response_code(404);
            return ['error' => 'Loan type not found'];
        }

        $stmt = $db->prepare("UPDATE loan_types SET name = :name, interest_rate = :interest_rate, interest_period = :interest_period, duration_months = :duration_months, admin_fee_percent = :admin_fee_percent WHERE id = :id");
        $stmt->execute([
            'name' => $data['name'],
            'interest_rate' => $data['interest_rate'],
            'interest_period' => $data['interest_period'] ?? 'annually',
            'duration_months' => $data['duration_months'],
            'admin_fee_percent' => $data['admin_fee_percent'] ?? 0,
            'id' => $id
        ]);

        return ['message' => 'Loan type updated successfully'];
    }

    public function destroy($id) {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();

        $check = $db->prepare("SELECT id FROM loan_types WHERE id = :id");
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
            http_response_code(404);
            return ['error' => 'Loan type not found'];
        }

        $stmt = $db->prepare("DELETE FROM loan_types WHERE id = :id");
        $stmt->execute(['id' => $id]);

        return ['message' => 'Loan type deleted successfully'];
    }
}
