import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const fetchGitHubUser = async (username) => {
    const response = await api.get(`/github/${username}`);
    return response.data;
};

export default api;
