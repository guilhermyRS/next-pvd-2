'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const loadUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const response = await fetch('http://localhost:3001/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
        }
    };

    useEffect(() => {
        loadUser();
    }, [refreshTrigger]);

    const updateUser = (newUserData) => {
        setUser(newUserData);
    };

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <UserContext.Provider value={{ user, updateUser, triggerRefresh, loadUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}