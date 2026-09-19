import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('h2_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global responses and unauthenticated redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register' && path !== '/') {
        localStorage.removeItem('h2_token');
        localStorage.removeItem('h2_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const reportsService = {
  upload: (formData, onProgress) =>
    api.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    }),
  getAll: (sort = 'desc') => api.get(`/reports?sort=${sort}`),
  getById: (id) => api.get(`/reports/${id}`),
  delete: (id) => api.delete(`/reports/${id}`),
  reanalyze: (id) => api.post(`/reports/${id}/analyze`),
  downloadPdf: (id) =>
    api.get(`/reports/${id}/download-summary`, { responseType: 'blob' }),
};

export const comparisonsService = {
  createComparison: (oldReportId, newReportId) =>
    api.post('/comparisons', {
      old_report_id: parseInt(oldReportId, 10),
      new_report_id: parseInt(newReportId, 10),
    }),
  queryComparison: (oldReportId, newReportId) =>
    api.get(`/reports/compare/query?old_report_id=${oldReportId}&new_report_id=${newReportId}`),
  getHistory: () => api.get('/comparisons/history'),
};

export const usersService = {
  getDashboard: () => api.get('/users/me/dashboard'),
};

export default api;
