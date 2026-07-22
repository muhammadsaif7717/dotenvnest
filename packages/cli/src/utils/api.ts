import axios from "axios";
import { readConfig } from "./config";

const BASE_URL = "https://dotenvnest.vercel.app/api/cli";
// const BASE_URL = "http://localhost:3000/api/cli"; // For local testing

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const { token } = readConfig();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiError = (error: any): string => {
  if (error.response) {
    return (
      error.response.data?.error ||
      error.response.data?.message ||
      `Server Error: ${error.response.status}`
    );
  } else if (error.request) {
    return "Network error. Please check your internet connection.";
  }
  return error.message;
};
