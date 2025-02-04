import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api'
});

// Adiciona um interceptor para incluir o token em todas as requisições
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const getEmployees = async () => {
    const response = await api.get('/employees');
    return response.data;
};

export const createEmployee = async (employeeData) => {
    const headers = employeeData instanceof FormData ? {} : { 'Content-Type': 'application/json' };
    const response = await api.post('/employees', employeeData, { headers });
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const headers = employeeData instanceof FormData ? {} : { 'Content-Type': 'application/json' };
    const response = await api.put(`/employees/${id}`, employeeData, { headers });
    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
};

// Funções de empresas corrigidas
export const getCompanies = async () => {
    const response = await api.get('/companies');
    return response.data;
};

export const createCompany = async (data) => {
    const response = await api.post('/companies', data);
    return response.data;
};

export const updateCompany = async (id, data) => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
};

export const deleteCompany = async (id) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
};

export const getCompanyEmployees = async (id) => {
    const response = await api.get(`/companies/${id}/employees`);
    return response.data;
};

export const addEmployeeToCompany = async (companyId, employeeId) => {
    const response = await api.post(`/companies/${companyId}/employees`, { employeeId });
    return response.data;
};

export const removeEmployeeFromCompany = async (companyId, employeeId) => {
    const response = await api.delete(`/companies/${companyId}/employees/${employeeId}`);
    return response.data;
};

export const getUserCompany = async () => {
    const response = await api.get('/user/company');
    return response.data;
};