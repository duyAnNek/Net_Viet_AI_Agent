// client/src/services/auth.service.js
import api from '../api/axios';

const normEmail = (e) => (e || '').trim().toLowerCase();

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email: normEmail(email), password });
    return res.data;
  },

  checkAvailability: (payload) =>
    api.post('/auth/check-availability', payload).then(r => r.data),

  startEmail: (payload) =>
    api.post('/auth/email/start', payload).then(r => r.data),

  verifyEmail: (payload) =>
    api.post('/auth/email/verify', payload).then(r => r.data),

  completeSignup: (payload) =>
    api.post('/auth/email/complete-signup', payload).then(r => r.data),

  // Forgot password
  startReset: (email) =>
    api.post('/auth/password/start', { email: normEmail(email) }).then(r => r.data),

  verifyReset: ({ email, code }) =>
    api.post('/auth/password/verify', { email: normEmail(email), code }).then(r => r.data),

  completeReset: ({ ticket, newPassword }) =>
    api.post('/auth/password/complete', { ticket, newPassword }).then(r => r.data),
};