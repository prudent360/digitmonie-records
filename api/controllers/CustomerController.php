<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class CustomerController {

    public function index() {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();

        $search = $_GET['search'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        if ($search) {
            $stmt = $db->prepare("SELECT * FROM customers WHERE full_name LIKE :search OR email LIKE :search2 OR phone LIKE :search3 ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
            $stmt->bindValue('search', "%$search%");
            $stmt->bindValue('search2', "%$search%");
            $stmt->bindValue('search3', "%$search%");
            $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $countStmt = $db->prepare("SELECT COUNT(*) as total FROM customers WHERE full_name LIKE :search OR email LIKE :search2 OR phone LIKE :search3");
            $countStmt->execute(['search' => "%$search%", 'search2' => "%$search%", 'search3' => "%$search%"]);
        } else {
            $stmt = $db->prepare("SELECT * FROM customers ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
            $stmt->bindValue('limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue('offset', $offset, PDO::PARAM_INT);
            $stmt->execute();

            $countStmt = $db->query("SELECT COUNT(*) as total FROM customers");
        }

        $customers = $stmt->fetchAll();
        $total = $countStmt->fetch()['total'];

        return [
            'customers' => $customers,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => intval($total),
                'pages' => ceil($total / $limit)
            ]
        ];
    }

    public function show($id) {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("SELECT * FROM customers WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $customer = $stmt->fetch();

        if (!$customer) {
            http_response_code(404);
            return ['error' => 'Customer not found'];
        }

        // Get customer's loans
        $loanStmt = $db->prepare("SELECT * FROM loans WHERE customer_id = :id ORDER BY created_at DESC");
        $loanStmt->execute(['id' => $id]);
        $loans = $loanStmt->fetchAll();

        $customer['loans'] = $loans;

        return ['customer' => $customer];
    }

    public function store() {
        Auth::isStaffOrAdmin();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['full_name']) || empty($data['phone'])) {
            http_response_code(400);
            return ['error' => 'Full name and phone are required'];
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("INSERT INTO customers (full_name, email, phone, address, id_number) VALUES (:full_name, :email, :phone, :address, :id_number)");
        $stmt->execute([
            'full_name' => $data['full_name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'],
            'address' => $data['address'] ?? null,
            'id_number' => $data['id_number'] ?? null
        ]);

        $id = $db->lastInsertId();

        http_response_code(201);
        return ['message' => 'Customer created successfully', 'id' => $id];
    }

    public function update($id) {
        Auth::isStaffOrAdmin();
        $data = json_decode(file_get_contents('php://input'), true);

        $db = Database::getInstance()->getConnection();
        
        $check = $db->prepare("SELECT id FROM customers WHERE id = :id");
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
            http_response_code(404);
            return ['error' => 'Customer not found'];
        }

        $stmt = $db->prepare("UPDATE customers SET full_name = :full_name, email = :email, phone = :phone, address = :address, id_number = :id_number WHERE id = :id");
        $stmt->execute([
            'full_name' => $data['full_name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'],
            'address' => $data['address'] ?? null,
            'id_number' => $data['id_number'] ?? null,
            'id' => $id
        ]);

        return ['message' => 'Customer updated successfully'];
    }

    public function destroy($id) {
        Auth::isStaffOrAdmin();
        $db = Database::getInstance()->getConnection();

        $check = $db->prepare("SELECT id FROM customers WHERE id = :id");
        $check->execute(['id' => $id]);
        if (!$check->fetch()) {
            http_response_code(404);
            return ['error' => 'Customer not found'];
        }

        $stmt = $db->prepare("DELETE FROM customers WHERE id = :id");
        $stmt->execute(['id' => $id]);

        return ['message' => 'Customer deleted successfully'];
    }
}
