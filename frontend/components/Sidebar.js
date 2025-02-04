'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Auth from '@/utils/Auth';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useUser } from '@/contexts/UserContext';
import { getUserCompany } from '@/services/api';

export default function Sidebar() {
    const { user, loadUser } = useUser();
    const router = useRouter();
    const isAdmin = Auth.isAdmin();
    const [userCompany, setUserCompany] = useState(null);

    useEffect(() => {
        const fetchUserCompany = async () => {
            try {
                const company = await getUserCompany();
                setUserCompany(company);
            } catch (error) {
                console.error('Erro ao buscar empresa do usuário:', error);
            }
        };

        if (user) {
            fetchUserCompany();
        }
    }, [user]);
    // Função para pegar as iniciais do nome
    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const handleFuncionariosClick = () => {
        if (!isAdmin) {
            toast.error('Você não tem permissão para acessar a página de funcionários');
            return;
        }
        router.push('/dashboard/funcionarios');
    };

    const handleLogout = () => {
        Auth.logout();
        toast.success('Logout realizado com sucesso!');
        router.push('/login');
    };

    return (
        <div className="h-screen w-64 bg-gray-800 text-white fixed left-0 top-0">
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    {user && (
                        <>
                            <div className="relative w-12 h-12">
                                {user.avatar ? (
                                    <div className="w-12 h-12 rounded-full overflow-hidden">
                                        <Image
                                            src={`http://localhost:3001/${user.avatar}`}
                                            alt="Foto de perfil"
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover"
                                            priority
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                                        <span className="text-2xl text-white">
                                            {getInitials(user.fullName)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {user.fullName?.split(' ')[0]}
                                </h2>
                                <p className="text-sm text-gray-400">
                                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <nav className="mt-4">
                <ul className="space-y-2">
                    <li>
                        <button
                            onClick={handleFuncionariosClick}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${!isAdmin ? 'text-gray-400' : ''
                                }`}
                        >
                            Funcionários
                            {!isAdmin && <span className="ml-2 text-xs">(Acesso restrito)</span>}
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => router.push('/dashboard/empresas')}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${!isAdmin ? 'text-gray-400' : ''
                                }`}
                        >
                            Empresas
                            {!isAdmin && <span className="ml-2 text-xs">(Acesso restrito)</span>}
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => router.push('/dashboard/perfil')}
                            className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                        >
                            Meu Perfil
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-red-400"
                        >
                            Sair
                        </button>
                    </li>
                </ul>
            </nav>
            <div className="mt-4 px-4 py-2 border-t border-gray-700">
                <p className="text-sm text-gray-400">Empresa atual:</p>
                {userCompany ? (
                    <p className="text-sm">{userCompany.name}</p>
                ) : (
                    <p className="text-sm text-yellow-400">
                        Não vinculado a nenhuma empresa
                    </p>
                )}
            </div>
        </div>
    );
}