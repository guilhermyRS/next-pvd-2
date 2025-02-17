'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Auth from '@/utils/Auth';
import { useUser } from '@/contexts/UserContext';

export default function Login() {
    const router = useRouter();
    const { updateUser, triggerRefresh } = useUser();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Primeiro, atualiza o Auth e o contexto do usuário
                Auth.login(data.token, data.user);
                updateUser(data.user);
                
                // Mostra a mensagem de sucesso
                toast.success('Login realizado com sucesso!');
                
                // Aguarda um momento para garantir que o contexto foi atualizado
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Força uma atualização do contexto
                triggerRefresh();
                
                // Redireciona para a página inicial
                router.push('/');
                router.refresh(); // Força atualização da navegação
            } else {
                toast.error(data.message || 'Erro ao fazer login');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            toast.error('Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Usuário
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Senha
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Entrando...
                            </div>
                        ) : (
                            'Entrar'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}