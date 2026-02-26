<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

class DashboardController {

    public function index() {
        Auth::getAuthenticatedAdmin();
        $db = Database::getInstance()->getConnection();

        // Total customers
        $customers = $db->query("SELECT COUNT(*) as total FROM customers")->fetch()['total'];

        // Loan statistics
        $loanStats = $db->query("SELECT 
            COUNT(*) as total_loans,
            COALESCE(SUM(principal_amount), 0) as total_disbursed,
            COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active_loans,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed_loans,
            COALESCE(SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END), 0) as defaulted_loans,
            COALESCE(SUM(total_interest), 0) as total_interest,
            COALESCE(SUM(admin_fee_amount), 0) as total_admin_fees,
            COALESCE(SUM(profit), 0) as total_profit
        FROM loans")->fetch();

        // Repayment statistics
        $repaymentStats = $db->query("SELECT 
            COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_due ELSE 0 END), 0) as total_collected,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_due ELSE 0 END), 0) as total_pending,
            COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount_due ELSE 0 END), 0) as total_overdue,
            COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
        FROM repayments")->fetch();

        // Recent loans
        $recentLoans = $db->query("SELECT l.*, c.full_name as customer_name 
                                   FROM loans l 
                                   LEFT JOIN customers c ON l.customer_id = c.id 
                                   ORDER BY l.created_at DESC LIMIT 5")->fetchAll();

        // Upcoming repayments (next 7 days)
        $upcoming = $db->query("SELECT r.*, l.id as loan_id, c.full_name as customer_name 
                                FROM repayments r 
                                LEFT JOIN loans l ON r.loan_id = l.id 
                                LEFT JOIN customers c ON l.customer_id = c.id 
                                WHERE r.status = 'pending' AND r.due_date <= date('now', '+7 days') 
                                ORDER BY r.due_date ASC LIMIT 10")->fetchAll();

        // Monthly collection data (last 6 months)
        $monthlyData = $db->query("SELECT 
            strftime('%Y-%m', paid_date) as month,
            SUM(amount_due) as collected
        FROM repayments 
        WHERE status = 'paid' AND paid_date IS NOT NULL AND paid_date >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', paid_date)
        ORDER BY month ASC")->fetchAll();

        return [
            'stats' => [
                'total_customers' => intval($customers),
                'total_loans' => intval($loanStats['total_loans']),
                'total_disbursed' => floatval($loanStats['total_disbursed']),
                'active_loans' => intval($loanStats['active_loans']),
                'completed_loans' => intval($loanStats['completed_loans']),
                'defaulted_loans' => intval($loanStats['defaulted_loans']),
                'total_interest' => floatval($loanStats['total_interest']),
                'total_admin_fees' => floatval($loanStats['total_admin_fees']),
                'total_profit' => floatval($loanStats['total_profit']),
                'total_collected' => floatval($repaymentStats['total_collected']),
                'total_pending' => floatval($repaymentStats['total_pending']),
                'total_overdue' => floatval($repaymentStats['total_overdue']),
                'overdue_count' => intval($repaymentStats['overdue_count'])
            ],
            'recent_loans' => $recentLoans,
            'upcoming_repayments' => $upcoming,
            'monthly_collections' => $monthlyData
        ];
    }
}
