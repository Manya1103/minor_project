import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const getExpense = (id) => api.get(`/expenses/${id}`);
export const createExpense = (data) => api.post('/expenses', data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);
export const scanReceipt = (formData) => api.post('/expenses/scan', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const categorizeText = (data) => api.post('/expenses/categorize', data);

// Goals
export const getGoals = (params) => api.get('/goals', { params });
export const getGoal = (id) => api.get(`/goals/${id}`);
export const createGoal = (data) => api.post('/goals', data);
export const updateGoal = (id, data) => api.put(`/goals/${id}`, data);
export const deleteGoal = (id) => api.delete(`/goals/${id}`);
export const contributeToGoal = (id, amount) => api.post(`/goals/${id}/contribute`, { amount });
export const getGoalRecommendations = (id) => api.get(`/goals/${id}/recommendations`);

// Analytics
export const getSummary = (params) => api.get('/analytics/summary', { params });
export const getTrends = (params) => api.get('/analytics/trends', { params });
export const getPredictions = () => api.get('/analytics/predictions');
export const getTopExpenses = (params) => api.get('/analytics/top-expenses', { params });
export const getComparison = () => api.get('/analytics/comparison');

// Voice
export const processVoiceCommand = (data) => api.post('/voice/command', data);

export default api;
