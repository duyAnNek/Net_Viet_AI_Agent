// client/src/services/data.service.js
import api from '../api/axios';

export const dataService = {
  getEmployees: () => api.get('/employees').then(r => r.data),            
  getProducts: () => api.get('/products').then(r => r.data),              
  getInventoryValue: () => api.get('/inventory/value').then(r => r.data), 
};