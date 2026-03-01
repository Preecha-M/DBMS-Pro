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
  const method = response.config.method;
  const url = typeof response.config.url === 'string' ? response.config.url : '';
  
  if (method === 'get' && url.includes('/menu')) {
    cache[url] = { data: response.data, timestamp: Date.now() };
  } else if (['post', 'put', 'patch', 'delete'].includes(method) && url.includes('/menu')) {
    Object.keys(cache).forEach(key => {
      if (key.includes('/menu')) {
        delete cache[key];
      }
    });
  }
  return response;
});

export default api;