<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class AuthController {

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['email']) || empty($data['password'])) {
            http_response_code(400);
            return ['error' => 'Email and password are required'];
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT * FROM admins WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $data['email']]);
        $admin = $stmt->fetch();

        if (!$admin || !password_verify($data['password'], $admin['password_hash'])) {
            http_response_code(401);
            return ['error' => 'Invalid email or password'];
        }

        $token = Auth::generateToken($admin['id'], $admin['email'], $admin['role']);

        return [
            'message' => 'Login successful',
            'token' => $token,
            'admin' => [
                'id' => $admin['id'],
                'name' => $admin['name'],
                'email' => $admin['email'],
                'role' => $admin['role']
            ]
        ];
    }

    public function me() {
        $auth = Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, name, email, role, created_at FROM admins WHERE id = :id");
        $stmt->execute(['id' => $auth['sub']]);
        $admin = $stmt->fetch();

        if (!$admin) {
            http_response_code(404);
            return ['error' => 'Admin not found'];
        }

        return ['admin' => $admin];
    }
}
