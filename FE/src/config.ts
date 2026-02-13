
const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE_URL = RAW_URL.replace(/\/$/, '');

export const API_URL = `${API_BASE_URL}/api`;

export default API_URL;
