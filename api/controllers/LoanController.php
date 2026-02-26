<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/LoanCalculator.php';

class LoanController {

    public function index() {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();

        $status = $_GET['status'] ?? '';
        $page = max(1, intval($_GET['page'] ?? 1));
        $limit = max(1, min(100, intval($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;

        $where = '';
        $params = [];
        if ($status && in_array($status, ['active', 'completed', 'defaulted'])) {
            $where = 'WHERE l.status = :status';
            $params['status'] = $status;
        }

        $sql = "SELECT l.*, c.full_name as customer_name, c.phone as customer_phone, lt.name as loan_type_name 
                FROM loans l 
                LEFT JOIN customers c ON l.customer_id = c.id 
                LEFT JOIN loan_types lt ON l.loan_type_id = lt.id 
                $where 
                ORDER BY l.created_at DESC 
                LIMIT $limit OFFSET $offset";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $loans = $stmt->fetchAll();

        $countSql = "SELECT COUNT(*) as total FROM loans l $where";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        return [
            'loans' => $loans,
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

        $stmt = $db->prepare("SELECT l.*, c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email, lt.name as loan_type_name 
                              FROM loans l 
                              LEFT JOIN customers c ON l.customer_id = c.id 
                              LEFT JOIN loan_types lt ON l.loan_type_id = lt.id 
                              WHERE l.id = :id");
        $stmt->execute(['id' => $id]);
        $loan = $stmt->fetch();

        if (!$loan) {
            http_response_code(404);
            return ['error' => 'Loan not found'];
        }

        // Get repayment schedule
        $repStmt = $db->prepare("SELECT * FROM repayments WHERE loan_id = :id ORDER BY month_number ASC");
        $repStmt->execute(['id' => $id]);
        $loan['repayments'] = $repStmt->fetchAll();

        // Calculate paid summary
        $paidStmt = $db->prepare("SELECT COUNT(*) as paid_count, COALESCE(SUM(amount_due), 0) as total_paid FROM repayments WHERE loan_id = :id AND status = 'paid'");
        $paidStmt->execute(['id' => $id]);
        $loan['payment_summary'] = $paidStmt->fetch();

        return ['loan' => $loan];
    }

    public function store() {
        try {
            Auth::isStaffOrAdmin();
            $data = json_decode(file_get_contents('php://input'), true);

            if (!$data) {
                http_response_code(400);
                return ['error' => 'Invalid JSON input'];
            }

            // Validate required fields
            $required = ['customer_id', 'principal_amount', 'interest_rate', 'duration_months', 'disbursement_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    http_response_code(400);
                    return ['error' => "$field is required"];
                }
            }

            $db = Database::getInstance()->getConnection();

            // Verify customer exists
            $custCheck = $db->prepare("SELECT id FROM customers WHERE id = :id");
            $custCheck->execute(['id' => $data['customer_id']]);
            if (!$custCheck->fetch()) {
                http_response_code(404);
                return ['error' => 'Customer not found'];
            }

            $principal = floatval($data['principal_amount']);
            $rate = floatval($data['interest_rate']);
            $months = intval($data['duration_months']);
            $interest_period = isset($data['interest_period']) ? $data['interest_period'] : 'annually';
            $admin_fee_percent = floatval(isset($data['admin_fee_percent']) ? $data['admin_fee_percent'] : 0);
            $disbursement_date = $data['disbursement_date'];
            $loan_type_id = !empty($data['loan_type_id']) ? $data['loan_type_id'] : null;

            // Calculate everything
            $calc = LoanCalculator::preview($principal, $rate, $months, $interest_period, $admin_fee_percent, $disbursement_date);

            // Begin transaction
            $db->beginTransaction();

            // Insert loan
            $stmt = $db->prepare("INSERT INTO loans (customer_id, loan_type_id, principal_amount, interest_rate, interest_period, duration_months, admin_fee_percent, admin_fee_amount, total_interest, total_repayment, monthly_payment, profit, status, disbursement_date) VALUES (:customer_id, :loan_type_id, :principal_amount, :interest_rate, :interest_period, :duration_months, :admin_fee_percent, :admin_fee_amount, :total_interest, :total_repayment, :monthly_payment, :profit, 'active', :disbursement_date)");
            
            $stmt->execute([
                'customer_id' => $data['customer_id'],
                'loan_type_id' => $loan_type_id,
                'principal_amount' => $principal,
                'interest_rate' => $rate,
                'interest_period' => $interest_period,
                'duration_months' => $months,
                'admin_fee_percent' => $admin_fee_percent,
                'admin_fee_amount' => $calc['admin_fee_amount'],
                'total_interest' => $calc['total_interest'],
                'total_repayment' => $calc['total_repayment'],
                'monthly_payment' => $calc['monthly_payment'],
                'profit' => $calc['profit'],
                'disbursement_date' => $disbursement_date
            ]);

            $loan_id = $db->lastInsertId();

            // Insert repayment schedule
            $repStmt = $db->prepare("INSERT INTO repayments (loan_id, month_number, opening_balance, principal_component, interest_component, closing_balance, amount_due, due_date, status) VALUES (:loan_id, :month_number, :opening_balance, :principal_component, :interest_component, :closing_balance, :amount_due, :due_date, 'pending')");

            foreach ($calc['schedule'] as $row) {
                $repStmt->execute([
                    'loan_id' => $loan_id,
                    'month_number' => $row['month_number'],
                    'opening_balance' => $row['opening_balance'],
                    'principal_component' => $row['principal_component'],
                    'interest_component' => $row['interest_component'],
                    'closing_balance' => $row['closing_balance'],
                    'amount_due' => $row['amount_due'],
                    'due_date' => $row['due_date']
                ]);
            }

            $db->commit();

            http_response_code(201);
            return [
                'message' => 'Loan created successfully',
                'id' => $loan_id,
                'calculation' => $calc
            ];
        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            http_response_code(500);
            return ['error' => 'Failed to create loan: ' . $e->getMessage()];
        }
    }

    public function calculate() {
        Auth::getAuthenticatedAdmin();
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['principal_amount', 'interest_rate', 'duration_months'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                http_response_code(400);
                return ['error' => "$field is required"];
            }
        }

        $calc = LoanCalculator::preview(
            floatval($data['principal_amount']),
            floatval($data['interest_rate']),
            intval($data['duration_months']),
            $data['interest_period'] ?? 'annually',
            floatval($data['admin_fee_percent'] ?? 0),
            $data['disbursement_date'] ?? null
        );

        return ['calculation' => $calc];
    }

    public function updateStatus($id) {
        Auth::isStaffOrAdmin();
        $data = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance()->getConnection();

        if (empty($data['status']) || !in_array($data['status'], ['active', 'completed', 'defaulted'])) {
            http_response_code(400);
            return ['error' => 'Valid status is required (active, completed, defaulted)'];
        }

        $stmt = $db->prepare("UPDATE loans SET status = :status WHERE id = :id");
        $stmt->execute(['status' => $data['status'], 'id' => $id]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            return ['error' => 'Loan not found'];
        }

        return ['message' => 'Loan status updated successfully'];
    }

    public function update($id) {
        try {
            Auth::isStaffOrAdmin();
            $data = json_decode(file_get_contents('php://input'), true);
            $db = Database::getInstance()->getConnection();

            // Check loan exists
            $check = $db->prepare("SELECT * FROM loans WHERE id = :id");
            $check->execute(['id' => $id]);
            $loan = $check->fetch();
            if (!$loan) {
                http_response_code(404);
                return ['error' => 'Loan not found'];
            }

            $principal = floatval(isset($data['principal_amount']) ? $data['principal_amount'] : $loan['principal_amount']);
            $rate = floatval(isset($data['interest_rate']) ? $data['interest_rate'] : $loan['interest_rate']);
            $months = intval(isset($data['duration_months']) ? $data['duration_months'] : $loan['duration_months']);
            $interest_period = isset($data['interest_period']) ? $data['interest_period'] : $loan['interest_period'];
            $admin_fee_percent = floatval(isset($data['admin_fee_percent']) ? $data['admin_fee_percent'] : $loan['admin_fee_percent']);
            $disbursement_date = isset($data['disbursement_date']) ? $data['disbursement_date'] : $loan['disbursement_date'];
            $loan_type_id = array_key_exists('loan_type_id', $data) ? (!empty($data['loan_type_id']) ? $data['loan_type_id'] : null) : $loan['loan_type_id'];

            // Recalculate
            $calc = LoanCalculator::preview($principal, $rate, $months, $interest_period, $admin_fee_percent, $disbursement_date);

            $db->beginTransaction();

            // Update loan record
            $stmt = $db->prepare("UPDATE loans SET 
                loan_type_id = :loan_type_id,
                principal_amount = :principal_amount,
                interest_rate = :interest_rate,
                interest_period = :interest_period,
                duration_months = :duration_months,
                admin_fee_percent = :admin_fee_percent,
                admin_fee_amount = :admin_fee_amount,
                total_interest = :total_interest,
                total_repayment = :total_repayment,
                monthly_payment = :monthly_payment,
                profit = :profit,
                disbursement_date = :disbursement_date
                WHERE id = :id");

            $stmt->execute([
                'loan_type_id' => $loan_type_id,
                'principal_amount' => $principal,
                'interest_rate' => $rate,
                'interest_period' => $interest_period,
                'duration_months' => $months,
                'admin_fee_percent' => $admin_fee_percent,
                'admin_fee_amount' => $calc['admin_fee_amount'],
                'total_interest' => $calc['total_interest'],
                'total_repayment' => $calc['total_repayment'],
                'monthly_payment' => $calc['monthly_payment'],
                'profit' => $calc['profit'],
                'disbursement_date' => $disbursement_date,
                'id' => $id
            ]);

            // Delete old repayments and insert new schedule
            $db->prepare("DELETE FROM repayments WHERE loan_id = :id")->execute(['id' => $id]);

            $repStmt = $db->prepare("INSERT INTO repayments (loan_id, month_number, opening_balance, principal_component, interest_component, closing_balance, amount_due, due_date, status) VALUES (:loan_id, :month_number, :opening_balance, :principal_component, :interest_component, :closing_balance, :amount_due, :due_date, 'pending')");

            foreach ($calc['schedule'] as $row) {
                $repStmt->execute([
                    'loan_id' => $id,
                    'month_number' => $row['month_number'],
                    'opening_balance' => $row['opening_balance'],
                    'principal_component' => $row['principal_component'],
                    'interest_component' => $row['interest_component'],
                    'closing_balance' => $row['closing_balance'],
                    'amount_due' => $row['amount_due'],
                    'due_date' => $row['due_date']
                ]);
            }

            $db->commit();

            return ['message' => 'Loan updated successfully', 'calculation' => $calc];
        } catch (Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            http_response_code(500);
            return ['error' => 'Failed to update loan: ' . $e->getMessage()];
        }
    }

    public function destroy($id) {
        try {
            Auth::isStaffOrAdmin();
            $db = Database::getInstance()->getConnection();

            // Check exists
            $check = $db->prepare("SELECT id FROM loans WHERE id = :id");
            $check->execute(['id' => $id]);
            if (!$check->fetch()) {
                http_response_code(404);
                return ['error' => 'Loan not found'];
            }

            // Delete loan (repayments cascade via FK)
            $db->prepare("DELETE FROM loans WHERE id = :id")->execute(['id' => $id]);

            return ['message' => 'Loan deleted successfully'];
        } catch (Exception $e) {
            http_response_code(500);
            return ['error' => 'Failed to delete loan: ' . $e->getMessage()];
        }
    }
}
