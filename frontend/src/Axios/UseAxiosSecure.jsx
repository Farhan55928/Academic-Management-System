import axios from 'axios';

const axiosSecure = axios.create({
  baseURL: 'http://localhost:9000',
  timeout: 18000,
  headers: { 'X-Custom-Header': 'foobar' },
});

axiosSecure.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const UseAxiosSecure = () => {
  return axiosSecure;
};

export default UseAxiosSecure;
