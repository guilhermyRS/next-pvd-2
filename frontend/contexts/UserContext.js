'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const router = useRouter();

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
                } else {
                    // Se a resposta não for ok, limpa o usuário e redireciona para login
                    setUser(null);
                    localStorage.removeItem('token');
                    router.push('/login');
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Erro ao carregar usuário:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUser();
    }, [refreshTrigger]);

    const updateUser = (newUserData) => {
        setUser(newUserData);
    };

    const clearUser = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <UserContext.Provider value={{ 
            user, 
            updateUser, 
            triggerRefresh, 
            loadUser, 
            clearUser,
            loading 
        }}>
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