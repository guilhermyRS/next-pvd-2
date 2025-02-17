'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Auth from '@/utils/Auth';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useUser } from '@/contexts/UserContext';
import { getUserCompany } from '@/services/api';
import { 
  ChevronDown, 
  ChevronUp, 
  Home, 
  ShoppingBag, 
  Users, 
  Building, 
  Package, 
  LogOut, 
  ChevronRight 
} from 'lucide-react';

export default function Sidebar() {
    const { user, clearUser, loading } = useUser();
    const router = useRouter();
    const isAdmin = Auth.isAdmin();
    const [userCompany, setUserCompany] = useState(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

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
        } else {
            setUserCompany(null);
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

    const handleLogout = () => {
        Auth.logout();
        clearUser();
        toast.success('Logout realizado com sucesso!');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="h-screen w-64 bg-gray-800 text-white fixed left-0 top-0 flex items-center justify-center border-r-2 border-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="h-screen w-64 bg-gray-800 text-white fixed left-0 top-0 flex flex-col shadow-lg border-r-2 border-white">
            {/* Logo e nome da aplicação */}
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold text-center text-white">Dashboard</h1>
            </div>

            {/* Menu principal */}
            <nav className="flex-grow py-6 px-3 overflow-y-auto">
                <ul className="space-y-2">
                    {/* Item Início */}
                    <li>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full flex items-center px-4 py-3 text-gray-100 hover:bg-gray-700 rounded-lg transition-colors group"
                        >
                            <Home size={20} className="mr-3 text-gray-300 group-hover:text-white transition-colors" />
                            <span className="text-sm font-medium">Início</span>
                        </button>
                    </li>

                    {/* Item Vendas */}
                    <li>
                        <button
                            onClick={() => router.push('/dashboard/vendas')}
                            className="w-full flex items-center px-4 py-3 text-gray-100 hover:bg-gray-700 rounded-lg transition-colors group"
                        >
                            <ShoppingBag size={20} className="mr-3 text-gray-300 group-hover:text-white transition-colors" />
                            <span className="text-sm font-medium">Vendas</span>
                        </button>
                    </li>

                    {/* Dropdown Painel (apenas admin) */}
                    {isAdmin && (
                        <li className="mt-6">
                            <div className="px-3 py-2 text-xs uppercase tracking-wider text-gray-400 font-semibold">
                                Administração
                            </div>
                            <button
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 text-gray-100 hover:bg-gray-700 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center">
                                    <Users size={20} className="mr-3 text-gray-300 group-hover:text-white transition-colors" />
                                    <span className="text-sm font-medium">Painel</span>
                                </div>
                                {isPanelOpen ? (
                                    <ChevronUp size={16} className="text-gray-300" />
                                ) : (
                                    <ChevronDown size={16} className="text-gray-300" />
                                )}
                            </button>

                            {/* Submenu do painel */}
                            {isPanelOpen && (
                                <ul className="pl-10 mt-1 space-y-1">
                                    <li>
                                        <button
                                            onClick={() => router.push('/dashboard/funcionarios')}
                                            className="w-full flex items-center py-2 px-2 text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            <ChevronRight size={14} className="mr-1 text-gray-400" />
                                            <span>Funcionários</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => router.push('/dashboard/empresas')}
                                            className="w-full flex items-center py-2 px-2 text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            <ChevronRight size={14} className="mr-1 text-gray-400" />
                                            <span>Empresas</span>
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            onClick={() => router.push('/dashboard/produtos')}
                                            className="w-full flex items-center py-2 px-2 text-sm text-gray-300 hover:text-white transition-colors"
                                        >
                                            <ChevronRight size={14} className="mr-1 text-gray-400" />
                                            <span>Produtos</span>
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </li>
                    )}
                </ul>
            </nav>

            {/* Rodapé com informações do usuário e botão de logout */}
            <div className="mt-auto">
                {/* Informações da empresa */}
                <div className="px-4 py-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-1">Empresa atual:</p>
                    {userCompany ? (
                        <p className="text-sm font-medium text-gray-200 flex items-center">
                            <Building size={14} className="mr-2 text-gray-400" />
                            {userCompany.name}
                        </p>
                    ) : (
                        <p className="text-sm font-medium text-yellow-300 flex items-center">
                            <Building size={14} className="mr-2 text-yellow-500" />
                            Não vinculado
                        </p>
                    )}
                </div>

                {/* Perfil do usuário */}
                {user && (
                    <button
                        onClick={() => router.push('/dashboard/perfil')}
                        className="w-full border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            {user.avatar ? (
                                <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-500">
                                    <Image
                                        src={`http://localhost:3001/${user.avatar}`}
                                        alt="Foto de perfil"
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover"
                                        priority
                                    />
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center ring-2 ring-gray-500">
                                    <span className="text-lg font-semibold text-white">
                                        {getInitials(user.fullName)}
                                    </span>
                                </div>
                            )}
                            <div className="text-left">
                                <p className="text-sm font-medium">{user.fullName?.split(' ')[0]}</p>
                                <p className="text-xs text-gray-400">
                                    {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                                </p>
                            </div>
                        </div>
                    </button>
                )}

                {/* Botão de logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center py-4 text-red-300 hover:bg-red-900/20 transition-colors border-t border-gray-700"
                >
                    <LogOut size={18} className="mr-2" />
                    <span className="text-sm font-medium">Sair</span>
                </button>
            </div>
        </div>
    );
}