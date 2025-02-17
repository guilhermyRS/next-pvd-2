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

// Add these to your api.js file

export const getProductCategories = async () => {
    const response = await api.get('/product-categories');
    return response.data;
};

export const createProductCategory = async (data) => {
    const response = await api.post('/product-categories', data);
    return response.data;
};

export const getProducts = async (companyId) => {
    const response = await api.get(`/products?companyId=${companyId}`);
    return response.data;
};

export const createProduct = async (productData) => {
    const formData = new FormData();
    
    // Convert numerical values to strings before appending
    Object.keys(productData).forEach(key => {
        if (productData[key] !== null && productData[key] !== undefined) {
            if (key === 'image') {
                formData.append('image', productData[key]);
            } else {
                // Convert numbers to strings
                formData.append(key, String(productData[key]));
            }
        }
    });

    try {
        const response = await api.post('/products', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};
export const updateProduct = async (id, productData) => {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
        if (productData[key] !== null && productData[key] !== undefined) {
            formData.append(key, productData[key]);
        }
    });
    const response = await api.put(`/products/${id}`, formData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};
// Adicione ao arquivo api.js se ainda não existir
export const getAllCompanies = async () => {
    try {
        const response = await api.get('/companies');
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        throw error;
    }
};