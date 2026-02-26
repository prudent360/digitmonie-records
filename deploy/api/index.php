<?php

/**
 * DigitMonie Records - API Router
 * Simple PHP router for the loan management system
 */

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/database.php';

// Get request info
$request_uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Remove query string and base path
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove /api prefix if present (for when hosted in subdirectory)
$path = preg_replace('#^/api#', '', $path);

// Remove trailing slash
$path = rtrim($path, '/');
if (empty($path)) $path = '/';

// Simple router
$response = null;

try {
    // Auth routes
    if ($path === '/auth/login' && $method === 'POST') {
        require_once __DIR__ . '/controllers/AuthController.php';
        $controller = new AuthController();
        $response = $controller->login();
    }
    elseif ($path === '/auth/me' && $method === 'GET') {
        require_once __DIR__ . '/controllers/AuthController.php';
        $controller = new AuthController();
        $response = $controller->me();
    }

    // Customer routes
    elseif ($path === '/customers' && $method === 'GET') {
        require_once __DIR__ . '/controllers/CustomerController.php';
        $controller = new CustomerController();
        $response = $controller->index();
    }
    elseif ($path === '/customers' && $method === 'POST') {
        require_once __DIR__ . '/controllers/CustomerController.php';
        $controller = new CustomerController();
        $response = $controller->store();
    }
    elseif (preg_match('#^/customers/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/controllers/CustomerController.php';
        $controller = new CustomerController();
        if ($method === 'GET') $response = $controller->show($matches[1]);
        elseif ($method === 'PUT') $response = $controller->update($matches[1]);
        elseif ($method === 'DELETE') $response = $controller->destroy($matches[1]);
    }

    // Loan type routes
    elseif ($path === '/loan-types' && $method === 'GET') {
        require_once __DIR__ . '/controllers/LoanTypeController.php';
        $controller = new LoanTypeController();
        $response = $controller->index();
    }
    elseif ($path === '/loan-types' && $method === 'POST') {
        require_once __DIR__ . '/controllers/LoanTypeController.php';
        $controller = new LoanTypeController();
        $response = $controller->store();
    }
    elseif (preg_match('#^/loan-types/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/controllers/LoanTypeController.php';
        $controller = new LoanTypeController();
        if ($method === 'GET') $response = $controller->show($matches[1]);
        elseif ($method === 'PUT') $response = $controller->update($matches[1]);
        elseif ($method === 'DELETE') $response = $controller->destroy($matches[1]);
    }

    // Loan routes
    elseif ($path === '/loans' && $method === 'GET') {
        require_once __DIR__ . '/controllers/LoanController.php';
        $controller = new LoanController();
        $response = $controller->index();
    }
    elseif ($path === '/loans' && $method === 'POST') {
        require_once __DIR__ . '/controllers/LoanController.php';
        $controller = new LoanController();
        $response = $controller->store();
    }
    elseif ($path === '/loans/calculate' && $method === 'POST') {
        require_once __DIR__ . '/controllers/LoanController.php';
        $controller = new LoanController();
        $response = $controller->calculate();
    }
    elseif (preg_match('#^/loans/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/controllers/LoanController.php';
        $controller = new LoanController();
        if ($method === 'GET') $response = $controller->show($matches[1]);
        elseif ($method === 'PUT') $response = $controller->updateStatus($matches[1]);
    }

    // Repayment routes
    elseif (preg_match('#^/loans/(\d+)/repayments$#', $path, $matches) && $method === 'GET') {
        require_once __DIR__ . '/controllers/RepaymentController.php';
        $controller = new RepaymentController();
        $response = $controller->getByLoan($matches[1]);
    }
    elseif (preg_match('#^/repayments/(\d+)/pay$#', $path, $matches) && $method === 'PUT') {
        require_once __DIR__ . '/controllers/RepaymentController.php';
        $controller = new RepaymentController();
        $response = $controller->markPaid($matches[1]);
    }
    elseif (preg_match('#^/repayments/(\d+)/unpay$#', $path, $matches) && $method === 'PUT') {
        require_once __DIR__ . '/controllers/RepaymentController.php';
        $controller = new RepaymentController();
        $response = $controller->markUnpaid($matches[1]);
    }

    // Dashboard route
    elseif ($path === '/dashboard' && $method === 'GET') {
        require_once __DIR__ . '/controllers/DashboardController.php';
        $controller = new DashboardController();
        $response = $controller->index();
    }

    // User routes
    elseif ($path === '/users' && $method === 'GET') {
        require_once __DIR__ . '/controllers/UserController.php';
        $controller = new UserController();
        $response = $controller->index();
    }
    elseif ($path === '/users' && $method === 'POST') {
        require_once __DIR__ . '/controllers/UserController.php';
        $controller = new UserController();
        $response = $controller->create();
    }
    elseif (preg_match('#^/users/(\d+)$#', $path, $matches)) {
        require_once __DIR__ . '/controllers/UserController.php';
        $controller = new UserController();
        if ($method === 'PUT') $response = $controller->update($matches[1]);
        elseif ($method === 'DELETE') $response = $controller->delete($matches[1]);
    }

    // 404
    else {
        http_response_code(404);
        $response = ['error' => 'Route not found', 'path' => $path, 'method' => $method];
    }

} catch (Exception $e) {
    http_response_code(500);
    $response = ['error' => 'Internal server error: ' . $e->getMessage()];
}

echo json_encode($response);
