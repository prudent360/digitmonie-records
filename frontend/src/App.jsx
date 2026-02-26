import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import LoanTypesPage from './pages/LoanTypesPage';
import LoansPage from './pages/LoansPage';
import NewLoanPage from './pages/NewLoanPage';
import LoanDetailPage from './pages/LoanDetailPage';
import UsersPage from './pages/UsersPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('dm_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:id" element={<CustomerDetailPage />} />
        <Route path="loan-types" element={<LoanTypesPage />} />
        <Route path="loans" element={<LoansPage />} />
        <Route path="loans/new" element={<NewLoanPage />} />
        <Route path="loans/:id" element={<LoanDetailPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}
