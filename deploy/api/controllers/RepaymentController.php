<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class RepaymentController {

    public function getByLoan($loan_id) {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("SELECT * FROM repayments WHERE loan_id = :loan_id ORDER BY month_number ASC");
        $stmt->execute(['loan_id' => $loan_id]);
        $repayments = $stmt->fetchAll();

        return ['repayments' => $repayments];
    }

    public function markPaid($id) {
        Auth::getAuthenticatedAdmin();
        $data = json_decode(file_get_contents('php://input'), true);
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("SELECT * FROM repayments WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $repayment = $stmt->fetch();

        if (!$repayment) {
            http_response_code(404);
            return ['error' => 'Repayment not found'];
        }

        $paid_date = $data['paid_date'] ?? date('Y-m-d');

        $update = $db->prepare("UPDATE repayments SET status = 'paid', paid_date = :paid_date WHERE id = :id");
        $update->execute(['paid_date' => $paid_date, 'id' => $id]);

        // Check if all repayments are paid, then mark loan as completed
        $checkStmt = $db->prepare("SELECT COUNT(*) as pending FROM repayments WHERE loan_id = :loan_id AND status != 'paid'");
        $checkStmt->execute(['loan_id' => $repayment['loan_id']]);
        $pending = $checkStmt->fetch()['pending'];

        if ($pending == 0) {
            $loanUpdate = $db->prepare("UPDATE loans SET status = 'completed' WHERE id = :id");
            $loanUpdate->execute(['id' => $repayment['loan_id']]);
        }

        return [
            'message' => 'Repayment marked as paid',
            'loan_completed' => $pending == 0
        ];
    }

    public function markUnpaid($id) {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();

        $stmt = $db->prepare("SELECT * FROM repayments WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $repayment = $stmt->fetch();

        if (!$repayment) {
            http_response_code(404);
            return ['error' => 'Repayment not found'];
        }

        $update = $db->prepare("UPDATE repayments SET status = 'pending', paid_date = NULL WHERE id = :id");
        $update->execute(['id' => $id]);

        // Re-open the loan if it was marked completed
        $loanUpdate = $db->prepare("UPDATE loans SET status = 'active' WHERE id = :id AND status = 'completed'");
        $loanUpdate->execute(['id' => $repayment['loan_id']]);

        return ['message' => 'Repayment marked as unpaid'];
    }
}
