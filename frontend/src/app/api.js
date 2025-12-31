// src/api/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', // ⚠️ Update port if needed
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
