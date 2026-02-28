import axios from "axios";



const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const cache = {};

api.interceptors.request.use((config) => {
  if (config.method === 'get' && typeof config.url === 'string' && config.url.includes('/menu')) {
    const cachedData = cache[config.url];
    // Cache for 5 minutes
    if (cachedData && Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
      config.adapter = () => {
        return Promise.resolve({
          data: cachedData.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        });
      };
    }
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (response.config.method === 'get' && typeof response.config.url === 'string' && response.config.url.includes('/menu')) {
    cache[response.config.url] = { data: response.data, timestamp: Date.now() };
  }
  return response;
});

export default api;