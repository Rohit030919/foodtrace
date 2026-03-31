import axios from 'axios';

const BASE_URL = "https://foodtrace-backend.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Response interceptor for cleaner errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data || err.message || 'Network error';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  }
);

export const createBatch = async ({ id, name, origin }) => {
  const res = await api.post('/createBatch', { id: Number(id), name, origin });
  return res.data;
};

export const updateBatch = async ({ id, stage, location }) => {
  const res = await api.post('/updateBatch', { id: Number(id), stage: Number(stage), location });
  return res.data;
};

export const getBatch = async (id) => {
  const res = await api.get(`/getBatch/${id}`);
  return res.data;
};

export const getHistory = async (id) => {
  const res = await api.get(`/getHistory/${id}`);
  return res.data;
};

export const getQR = async (id) => {
  const res = await api.get(`/generateQR/${id}`);
  return res.data.qr;
};

export const loginUser = async (username, password) => {
  const res = await api.post('/login', { username, password });
  return res.data;
};

export const registerUser = async (username, password) => {
  const res = await api.post('/register', { username, password });
  return res.data;
};

export default api;
