'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '@/utils/Auth';
import Sidebar from '@/components/Sidebar';
import { HiUsers, HiOfficeBuilding, HiChartBar, HiHome } from 'react-icons/hi';
import Image from 'next/image';

export default function Inicio() {
    const router = useRouter();

    useEffect(() => {
        if (!Auth.isAuthenticated()) {
            router.push('/login');
        }
    }, []);

    const menuCards = [
        {
            title: 'Funcionários',
            description: 'Gerencie todos os funcionários da empresa',
            icon: <HiUsers className="w-12 h-12 text-blue-600" />,
            path: '/dashboard/funcionarios',
            bgColor: 'bg-blue-50',
            requireAdmin: true
        },
        {
            title: 'Empresas',
            description: 'Administre as empresas cadastradas',
            icon: <HiOfficeBuilding className="w-12 h-12 text-green-600" />,
            path: '/dashboard/empresas',
            bgColor: 'bg-green-50',
            requireAdmin: true
        },
        {
            title: 'Relatórios',
            description: 'Visualize estatísticas e relatórios',
            icon: <HiChartBar className="w-12 h-12 text-purple-600" />,
            path: '/dashboard/relatorios',
            bgColor: 'bg-purple-50',
            requireAdmin: false
        }
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 ml-64 p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Bem-vindo ao Sistema</h1>
                    <p className="mt-2 text-gray-600">Selecione uma das opções abaixo para começar</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuCards.map((card, index) => (
                        (!card.requireAdmin || Auth.isAdmin()) && (
                            <div
                                key={index}
                                onClick={() => router.push(card.path)}
                                className={`${card.bgColor} p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="mb-4">
                                        {card.icon}
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                        {card.title}
                                    </h2>
                                    <p className="text-gray-600">
                                        {card.description}
                                    </p>
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* Footer Section */}
                <div className="mt-12 text-center text-gray-500">
                    <p>© 2025 Seu Sistema. Todos os direitos reservados.</p>
                </div>
            </main>
        </div>
    );
}