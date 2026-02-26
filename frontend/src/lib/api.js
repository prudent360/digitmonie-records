const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('dm_token');
  }

  setToken(token) {
    localStorage.setItem('dm_token', token);
  }

  removeToken() {
    localStorage.removeItem('dm_token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('Server returned invalid response. Check server logs for PHP errors.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        window.location.href = '/login';
      }
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request('/auth/me');
  }

  // Customers
  getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/customers?${query}`);
  }

  getCustomer(id) {
    return this.request(`/customers/${id}`);
  }

  createCustomer(data) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateCustomer(id, data) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteCustomer(id) {
    return this.request(`/customers/${id}`, { method: 'DELETE' });
  }

  // Loan Types
  getLoanTypes() {
    return this.request('/loan-types');
  }

  createLoanType(data) {
    return this.request('/loan-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateLoanType(id, data) {
    return this.request(`/loan-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteLoanType(id) {
    return this.request(`/loan-types/${id}`, { method: 'DELETE' });
  }

  // Loans
  getLoans(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/loans?${query}`);
  }

  getLoan(id) {
    return this.request(`/loans/${id}`);
  }

  createLoan(data) {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateLoan(id, data) {
    return this.request(`/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteLoan(id) {
    return this.request(`/loans/${id}`, { method: 'DELETE' });
  }

  updateLoanStatus(id, status) {
    return this.request(`/loans/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  calculateLoan(data) {
    return this.request('/loans/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Repayments
  markRepaymentPaid(id, paidDate) {
    return this.request(`/repayments/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify({ paid_date: paidDate }),
    });
  }

  markRepaymentUnpaid(id) {
    return this.request(`/repayments/${id}/unpay`, {
      method: 'PUT',
    });
  }

  // Dashboard
  getDashboard() {
    return this.request('/dashboard');
  }

  // Users
  getUsers() {
    return this.request('/users');
  }

  createUser(data) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateUser(id, data) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteUser(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
