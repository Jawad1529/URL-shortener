import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
});

export const shortenUrl = async (originalUrl) => {
    const { data } = await api.post('/shorten', { url: originalUrl });
    return data;
};

export const getLinks = async () => {
    const { data } = await api.get('/links');
    return data;
};

export const getAnalytics = async (shortCode) => {
    const { data } = await api.get(`/analytics/${shortCode}`);
    return data;
};

export default api;
