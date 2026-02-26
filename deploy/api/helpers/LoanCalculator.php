<?php

class LoanCalculator {

    /**
     * Calculate EMI (Equated Monthly Installment) using reducing balance method
     * 
     * @param float $principal - Loan amount
     * @param float $annual_rate - Annual interest rate (percentage, e.g. 15 for 15%)
     * @param int $months - Duration in months
     * @param string $interest_period - 'monthly' or 'annually'
     * @return float EMI amount
     */
    public static function calculateEMI($principal, $annual_rate, $months, $interest_period = 'annually') {
        $monthly_rate = self::getMonthlyRate($annual_rate, $interest_period);

        if ($monthly_rate == 0) {
            return round($principal / $months, 2);
        }

        $emi = $principal * $monthly_rate * pow(1 + $monthly_rate, $months) 
             / (pow(1 + $monthly_rate, $months) - 1);

        return round($emi, 2);
    }

    /**
     * Generate full amortization schedule using reducing balance
     * 
     * @param float $principal
     * @param float $annual_rate
     * @param int $months
     * @param string $interest_period
     * @param string $start_date - Disbursement date (Y-m-d)
     * @return array Schedule with each month's breakdown
     */
    public static function generateSchedule($principal, $annual_rate, $months, $interest_period = 'annually', $start_date = null) {
        $monthly_rate = self::getMonthlyRate($annual_rate, $interest_period);
        $emi = self::calculateEMI($principal, $annual_rate, $months, $interest_period);
        $balance = $principal;
        $schedule = [];
        $total_interest = 0;

        $start = $start_date ? new DateTime($start_date) : new DateTime();

        for ($i = 1; $i <= $months; $i++) {
            $interest = round($balance * $monthly_rate, 2);
            $principal_component = round($emi - $interest, 2);
            
            // Last month adjustment to clear balance exactly
            if ($i === $months) {
                $principal_component = round($balance, 2);
                $emi_adjusted = $principal_component + $interest;
            } else {
                $emi_adjusted = $emi;
            }

            $closing_balance = round($balance - $principal_component, 2);
            if ($closing_balance < 0) $closing_balance = 0;

            $due_date = clone $start;
            $due_date->modify("+{$i} months");

            $schedule[] = [
                'month_number' => $i,
                'opening_balance' => round($balance, 2),
                'interest_component' => $interest,
                'principal_component' => $principal_component,
                'amount_due' => round($emi_adjusted, 2),
                'closing_balance' => $closing_balance,
                'due_date' => $due_date->format('Y-m-d'),
                'status' => 'pending'
            ];

            $total_interest += $interest;
            $balance = $closing_balance;
        }

        return [
            'schedule' => $schedule,
            'total_interest' => round($total_interest, 2),
            'monthly_payment' => $emi,
            'total_repayment' => round($principal + $total_interest, 2)
        ];
    }

    /**
     * Calculate admin fee
     */
    public static function calculateAdminFee($principal, $admin_fee_percent) {
        return round($principal * ($admin_fee_percent / 100), 2);
    }

    /**
     * Calculate total profit (interest + admin fee)
     */
    public static function calculateProfit($total_interest, $admin_fee_amount) {
        return round($total_interest + $admin_fee_amount, 2);
    }

    /**
     * Get monthly interest rate from annual or monthly rate
     */
    private static function getMonthlyRate($rate, $interest_period) {
        $rate_decimal = $rate / 100;
        if ($interest_period === 'monthly') {
            return $rate_decimal;
        }
        return $rate_decimal / 12;
    }

    /**
     * Full calculation preview (without saving)
     */
    public static function preview($principal, $annual_rate, $months, $interest_period, $admin_fee_percent, $start_date = null) {
        $result = self::generateSchedule($principal, $annual_rate, $months, $interest_period, $start_date);
        $admin_fee = self::calculateAdminFee($principal, $admin_fee_percent);
        $profit = self::calculateProfit($result['total_interest'], $admin_fee);

        return [
            'principal' => $principal,
            'interest_rate' => $annual_rate,
            'interest_period' => $interest_period,
            'duration_months' => $months,
            'monthly_payment' => $result['monthly_payment'],
            'total_interest' => $result['total_interest'],
            'total_repayment' => $result['total_repayment'],
            'admin_fee_percent' => $admin_fee_percent,
            'admin_fee_amount' => $admin_fee,
            'profit' => $profit,
            'schedule' => $result['schedule']
        ];
    }
}
