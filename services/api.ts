/**
 * API SERVICE CONNECTOR (TEMPLATE)
 * 
 * Use this file to connect your React Frontend to your Laravel 12 Backend.
 * 
 * Instructions:
 * 1. Install axios: npm install axios
 * 2. Create a .env file with REACT_APP_API_URL=http://localhost:8000/api
 * 3. Replace the calls in your components with these functions.
 */

/* 
// import axios from 'axios';
// import { User, Partner, Event } from '../types';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// const api = axios.create({
//     baseURL: API_URL,
//     headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//     }
// });

// // --- Add Auth Token to Requests ---
// api.interceptors.request.use(config => {
//     const token = localStorage.getItem('auth_token');
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// export const ApiService = {
//     // --- Auth ---
//     login: async (email, password) => {
//         const response = await api.post('/login', { email, password });
//         localStorage.setItem('auth_token', response.data.token);
//         return response.data.user;
//     },

//     logout: async () => {
//         await api.post('/logout');
//         localStorage.removeItem('auth_token');
//     },

//     // --- Partners ---
//     getPartners: async () => {
//         const response = await api.get('/partners');
//         return response.data;
//     },

//     createPartner: async (data: Partial<Partner>) => {
//         // Note: For file uploads (logo), you should use FormData
//         const formData = new FormData();
//         Object.keys(data).forEach(key => formData.append(key, data[key]));
        
//         const response = await api.post('/partners', formData, {
//             headers: { 'Content-Type': 'multipart/form-data' }
//         });
//         return response.data;
//     },

//     // --- Events ---
//     getEvents: async () => {
//         const response = await api.get('/events');
//         return response.data;
//     },

//     createEvent: async (data: Partial<Event>) => {
//         const response = await api.post('/events', data);
//         return response.data;
//     }
// };
*/