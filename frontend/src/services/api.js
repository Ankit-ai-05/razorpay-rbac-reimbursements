const API_BASE_URL = import.meta.env.VITE_API_URL || '/rest';

export const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Default options
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // This is CRITICAL for sending and receiving the HTTP-only cookie
      credentials: 'include', 
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // Auth Endpoints
  login(credentials) {
    return this.request('/onboardings/login', {
      method: 'POST',
      body: credentials,
    });
  },

  register(userData) {
    return this.request('/onboardings/register', {
      method: 'POST',
      body: userData,
    });
  },

  logout() {
    return this.request('/onboardings/logout', {
      method: 'POST',
    });
  },

  // Reimbursement Endpoints
  getReimbursements() {
    return this.request('/reimbursements');
  },

  createReimbursement(data) {
    return this.request('/reimbursements', {
      method: 'POST',
      body: data,
    });
  },

  updateReimbursement(data) {
    return this.request('/reimbursements', {
      method: 'PATCH',
      body: data,
    });
  },

  // Employee/Role Endpoints
  getEmployees() {
    return this.request('/employees');
  },

  assignRole(data) {
    return this.request('/roles/assign', {
      method: 'POST',
      body: data,
    });
  },

  assignManager(data) {
    return this.request('/employees/assign', {
      method: 'POST',
      body: data,
    });
  }
};
