<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class UserController {

    public function index() {
        Auth::isAdmin(); // Only admins can list users
        
        $db = Database::getInstance()->getConnection();
        $stmt = $db->query("SELECT id, name, email, role, created_at FROM admins ORDER BY id DESC");
        return ['users' => $stmt->fetchAll()];
    }

    public function create() {
        Auth::isAdmin(); // Only admins can create users
        
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            http_response_code(400);
            return ['error' => 'All fields are required (name, email, password, role)'];
        }

        $db = Database::getInstance()->getConnection();
        
        // Check if email already exists
        $stmt = $db->prepare("SELECT id FROM admins WHERE email = :email");
        $stmt->execute(['email' => $data['email']]);
        if ($stmt->fetch()) {
            http_response_code(400);
            return ['error' => 'Email already exists'];
        }

        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $db->prepare("INSERT INTO admins (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)");
        $stmt->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'password_hash' => $password_hash,
            'role' => $data['role']
        ]);

        return ['message' => 'User created successfully', 'id' => $db->lastInsertId()];
    }

    public function update($id) {
        Auth::isAdmin(); // Only admins can update users
        
        $data = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance()->getConnection();

        // Check if user exists
        $stmt = $db->prepare("SELECT * FROM admins WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            return ['error' => 'User not found'];
        }

        $name = $data['name'] ?? $user['name'];
        $email = $data['email'] ?? $user['email'];
        $role = $data['role'] ?? $user['role'];

        // If email changed, check if new email exists
        if ($email !== $user['email']) {
            $check = $db->prepare("SELECT id FROM admins WHERE email = :email");
            $check->execute(['email' => $email]);
            if ($check->fetch()) {
                http_response_code(400);
                return ['error' => 'Email already exists'];
            }
        }

        if (!empty($data['password'])) {
            $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE admins SET name = :name, email = :email, password_hash = :password_hash, role = :role WHERE id = :id");
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'password_hash' => $password_hash,
                'role' => $role,
                'id' => $id
            ]);
        } else {
            $stmt = $db->prepare("UPDATE admins SET name = :name, email = :email, role = :role WHERE id = :id");
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'role' => $role,
                'id' => $id
            ]);
        }

        return ['message' => 'User updated successfully'];
    }

    public function delete($id) {
        Auth::isAdmin(); // Only admins can delete users
        
        $auth = Auth::getAuthenticatedAdmin();
        if ($id == $auth['sub']) {
            http_response_code(400);
            return ['error' => 'You cannot delete your own account'];
        }

        $db = Database::getInstance()->getConnection();
        $stmt = $db->prepare("DELETE FROM admins WHERE id = :id");
        $stmt->execute(['id' => $id]);

        return ['message' => 'User deleted successfully'];
    }
}
