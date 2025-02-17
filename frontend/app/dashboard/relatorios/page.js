'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEmployees, getCompanies } from '@/services/api';
import Auth from '@/utils/Auth';
import Sidebar from '@/components/Sidebar';
import { HiUsers, HiUserGroup, HiShieldCheck, HiOfficeBuilding } from 'react-icons/hi';

export default function Relatorios() {
    const router = useRouter();
    const [stats, setStats] = useState({
        employees: {
            total: 0,
            admins: 0,
            users: 0
        },
        companies: {
            total: 0,
            active: 0,
            inactive: 0
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!Auth.isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [employees, companies] = await Promise.all([
                getEmployees(),
                getCompanies()
            ]);

            const employeeStats = employees.reduce((acc, employee) => {
                acc.total++;
                if (employee.role === 'admin') {
                    acc.admins++;
                } else {
                    acc.users++;
                }
                return acc;
            }, { total: 0, admins: 0, users: 0 });

            const companyStats = companies.reduce((acc, company) => {
                acc.total++;
                if (company.active) {
                    acc.active++;
                } else {
                    acc.inactive++;
                }
                return acc;
            }, { total: 0, active: 0, inactive: 0 });

            setStats({
                employees: employeeStats,
                companies: companyStats
            });
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 p-6 ">
                <h1 className="text-3xl font-bold mb-8">Relatórios e Estatísticas</h1>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Funcionários</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total de Funcionários */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total de Funcionários</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.employees.total}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <HiUsers className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* Administradores */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Administradores</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.employees.admins}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <HiShieldCheck className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Usuários */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Usuários</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.employees.users}</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <HiUserGroup className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-4">Empresas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total de Empresas */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.companies.total}</p>
                                </div>
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <HiOfficeBuilding className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                        </div>

                        {/* Empresas Ativas */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Empresas Ativas</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.companies.active}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <HiOfficeBuilding className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        {/* Empresas Inativas */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Empresas Inativas</p>
                                    <p className="text-3xl font-bold text-gray-900">{stats.companies.inactive}</p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-full">
                                    <HiOfficeBuilding className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}