'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Auth from '@/utils/Auth';
import { getUserCompany } from '@/services/api';
import {
    getCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyEmployees,
    getEmployees,
    addEmployeeToCompany,
    removeEmployeeFromCompany,
} from '@/services/api';

export default function Empresas() {
    const router = useRouter();
    const [companies, setCompanies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [companyEmployees, setCompanyEmployees] = useState([]);
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        cnpj: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!Auth.isAdmin()) {
            toast.error('Você não tem permissão para acessar esta página');
            router.push('/dashboard');
            return;
        }
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch (error) {
            toast.error('Erro ao carregar empresas');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (selectedCompany) {
                await updateCompany(selectedCompany.id, formData);
                toast.success('Empresa atualizada com sucesso!');
            } else {
                await createCompany(formData);
                toast.success('Empresa criada com sucesso!');
            }
            setFormData({ name: '', cnpj: '' });
            setSelectedCompany(null);
            setIsModalOpen(false);
            await loadCompanies();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar empresa');
        }
        setLoading(false);
    };

    const handleManage = async (company) => {
        setSelectedCompany(company);
        try {
            const [companyEmps, allEmps] = await Promise.all([
                getCompanyEmployees(company.id),
                getEmployees()
            ]);
            setCompanyEmployees(companyEmps);
            setAvailableEmployees(allEmps.filter(emp => 
                !companyEmps.find(cEmp => cEmp.id === emp.id)
            ));
            setIsManageModalOpen(true);
        } catch (error) {
            toast.error('Erro ao carregar dados da empresa');
        }
    };

    const handleAddEmployee = async (employeeId) => {
        try {
            await addEmployeeToCompany(selectedCompany.id, employeeId);
            toast.success('Funcionário adicionado com sucesso!');
            handleManage(selectedCompany);
        } catch (error) {
            toast.error('Erro ao adicionar funcionário');
        }
    };

    const handleRemoveEmployee = async (employeeId) => {
        try {
            await removeEmployeeFromCompany(selectedCompany.id, employeeId);
            toast.success('Funcionário removido com sucesso!');
            handleManage(selectedCompany);
        } catch (error) {
            toast.error('Erro ao remover funcionário');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
            try {
                await deleteCompany(id);
                toast.success('Empresa excluída com sucesso!');
                await loadCompanies();
            } catch (error) {
                toast.error('Erro ao excluir empresa');
            }
        }
    };

    const handleEdit = (company) => {
        setFormData({
            name: company.name,
            cnpj: company.cnpj
        });
        setSelectedCompany(company);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({ name: '', cnpj: '' });
        setSelectedCompany(null);
    };

    const handleCloseManageModal = () => {
        setIsManageModalOpen(false);
        setSelectedCompany(null);
        setCompanyEmployees([]);
        setAvailableEmployees([]);
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Gerenciar Empresas</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    Nova Empresa
                </button>
            </div>

            {/* Modal de Criação/Edição de Empresa */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {selectedCompany ? 'Editar Empresa' : 'Nova Empresa'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">CNPJ</label>
                                <input
                                    type="text"
                                    value={formData.cnpj}
                                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                >
                                    {loading ? 'Processando...' : (selectedCompany ? 'Atualizar' : 'Criar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Gerenciamento de Funcionários */}
            {isManageModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                Gerenciar Funcionários - {selectedCompany?.name}
                            </h2>
                            <button
                                onClick={handleCloseManageModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Lista de Funcionários Disponíveis */}
                            <div>
                                <h3 className="font-semibold mb-2">Funcionários Disponíveis</h3>
                                <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                                    {availableEmployees.map(employee => (
                                        <div key={employee.id} className="flex justify-between items-center p-2 hover:bg-gray-50">
                                            <span>{employee.fullName}</span>
                                            <button
                                                onClick={() => handleAddEmployee(employee.id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Adicionar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lista de Funcionários da Empresa */}
                            <div>
                                <h3 className="font-semibold mb-2">Funcionários da Empresa</h3>
                                <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                                    {companyEmployees.map(employee => (
                                        <div key={employee.id} className="flex justify-between items-center p-2 hover:bg-gray-50">
                                            <span>{employee.fullName}</span>
                                            <button
                                                onClick={() => handleRemoveEmployee(employee.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lista de Empresas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {companies.map(company => (
                            <tr key={company.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {company.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {company.cnpj}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleManage(company)}
                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                        Gerenciar
                                    </button>
                                    <button
                                        onClick={() => handleEdit(company)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(company.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Deletar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}