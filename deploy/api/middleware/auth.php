<?php

class Auth {
    private static $secret_key;

    public static function init() {
        self::$secret_key = getenv('JWT_SECRET') ?: 'digitmonie_records_secret_key_2024';
    }

    public static function generateToken($admin_id, $email, $role = 'admin') {
        $header = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::base64UrlEncode(json_encode([
            'sub' => $admin_id,
            'email' => $email,
            'role' => $role,
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]));

        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", self::$secret_key, true)
        );

        return "$header.$payload.$signature";
    }

    public static function verifyToken($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header, $payload, $signature] = $parts;

        $expected_sig = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", self::$secret_key, true)
        );

        if (!hash_equals($expected_sig, $signature)) return null;

        $data = json_decode(self::base64UrlDecode($payload), true);

        if ($data['exp'] < time()) return null;

        return $data;
    }

    public static function getAuthenticatedAdmin() {
        $headers = getallheaders();
        $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (empty($auth_header) || !str_starts_with($auth_header, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }

        $token = substr($auth_header, 7);
        $data = self::verifyToken($token);

        if (!$data) {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid or expired token']);
            exit;
        }

        return $data;
    }

    public static function isAdmin() {
        $data = self::getAuthenticatedAdmin();
        if ($data['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: Admin access required']);
            exit;
        }
        return $data;
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

Auth::init();
