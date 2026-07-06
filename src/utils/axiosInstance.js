import axios from "axios";
import { VITE_APP_SERVER_URL } from "../config";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: VITE_APP_SERVER_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: attach token if exists
axiosInstance.interceptors.request.use((config) => {
  const auth = localStorage.getItem("auth");
  
  if (auth) {
    const { token } = JSON.parse(auth);
   
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      
      localStorage.removeItem("auth");
      window.location.href = "/login";
    }
    return Promise.reject(error || "Something went wrong");
  }
);

export default axiosInstance;
