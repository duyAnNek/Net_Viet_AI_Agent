import { api } from '../api/axios';
export const chatService = {
  async send(message) {
    const { data } = await api.post('/chat', { message });
    return data; // { reply }
  }
};