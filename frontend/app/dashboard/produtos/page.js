'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Auth from '@/utils/Auth';
import { getProducts, createProduct, updateProduct, deleteProduct, getCompanies } from '@/services/api';
import Sidebar from '@/components/Sidebar';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiExclamation,
  HiSearch,
  HiCurrencyDollar,
  HiShoppingCart,
  HiArchive
} from 'react-icons/hi';

export default function Produtos() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const isAdmin = Auth.isAdmin();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cost_price: '',
    selling_price: '',
    package_quantity: '',
    unit_quantity: '',
    minimum_stock: '',
    current_stock: '',
    company_id: '',
    product_code: '',
    category: '',
    unit_measure: '',
    status: true
  });

  const categories = [
    'Papel',
    'Toner',
    'Cartuchos',
    'Equipamentos',
    'Suprimentos',
    'Outros'
  ];

  const unitMeasures = [
    'Unidade',
    'Caixa',
    'Pacote',
    'Metro',
    'Litro',
    'Quilograma'
  ];

  useEffect(() => {
    if (!Auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    loadData();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, companiesData] = await Promise.all([
        getProducts(),
        isAdmin ? getCompanies() : []
      ]);
      setProducts(productsData);
      setFilteredProducts(productsData);
      if (isAdmin) {
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    const filtered = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.product_code.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower) ||
        (product.company_name && product.company_name.toLowerCase().includes(searchLower))
      );
    });
    setFilteredProducts(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validações
      if (parseFloat(formData.selling_price) <= parseFloat(formData.cost_price)) {
        toast.error('O preço de venda deve ser maior que o custo');
        return;
      }

      if (parseFloat(formData.minimum_stock) > parseFloat(formData.current_stock)) {
        toast.warning('O estoque atual está abaixo do mínimo recomendado');
      }

      // Formatar valores numéricos
      const formattedData = {
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        package_quantity: parseInt(formData.package_quantity),
        unit_quantity: parseInt(formData.unit_quantity),
        minimum_stock: parseInt(formData.minimum_stock),
        current_stock: parseInt(formData.current_stock)
      };

      if (editingId) {
        await updateProduct(editingId, formattedData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await createProduct(formattedData);
        toast.success('Produto criado com sucesso!');
      }
      handleCloseModal();
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      package_quantity: product.package_quantity.toString(),
      unit_quantity: product.unit_quantity.toString(),
      minimum_stock: product.minimum_stock.toString(),
      current_stock: product.current_stock.toString(),
      company_id: product.company_id.toString(),
      product_code: product.product_code,
      category: product.category,
      unit_measure: product.unit_measure,
      status: product.status
    });
    setEditingId(product.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir produtos');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        setLoading(true);
        await deleteProduct(id);
        toast.success('Produto excluído com sucesso!');
        await loadData();
      } catch (error) {
        toast.error('Erro ao excluir produto');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      cost_price: '',
      selling_price: '',
      package_quantity: '',
      unit_quantity: '',
      minimum_stock: '',
      current_stock: '',
      company_id: '',
      product_code: '',
      category: '',
      unit_measure: '',
      status: true
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <HiSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
            
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
              >
                <HiPlus className="mr-2" />
                Novo Produto
              </button>
           
          </div>
        </div>

        {/* Modal de Produto */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Código do Produto
                      </label>
                      <input
                        type="text"
                        value={formData.product_code}
                        onChange={(e) => setFormData({
                          ...formData,
                          product_code: e.target.value
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome do Produto
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          name: e.target.value
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          description: e.target.value
                        })}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Categoria
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({
                          ...formData,
                          category: e.target.value
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isAdmin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Empresa
                        </label>
                        <select
                          value={formData.company_id}
                          onChange={(e) => setFormData({
                            ...formData,
                            company_id: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        >
                          <option value="">Selecione uma empresa</option>
                          {companies.map(company => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Informações de Preço e Estoque */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Preço de Custo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cost_price}
                          onChange={(e) => setFormData({
                            ...formData,
                            cost_price: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Preço de Venda
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.selling_price}
                          onChange={(e) => setFormData({
                            ...formData,
                            selling_price: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Quantidade por Pacote
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.package_quantity}
                          onChange={(e) => setFormData({
                            ...formData,
                            package_quantity: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div >

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Quantidade por Unidade
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.unit_quantity}
                          onChange={(e) => setFormData({
                            ...formData,
                            unit_quantity: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div >

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Estoque Mínimo
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.minimum_stock}
                          onChange={(e) => setFormData({
                            ...formData,
                            minimum_stock: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Estoque Atual
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.current_stock}
                          onChange={(e) => setFormData({
                            ...formData,
                            current_stock: e.target.value
                          })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Unidade de Medida
                      </label>
                      <select
                        value={formData.unit_measure}
                        onChange={(e) => setFormData({
                          ...formData,
                          unit_measure: e.target.value
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Selecione uma unidade</option>
                        {unitMeasures.map(measure => (
                          <option key={measure} value={measure}>
                            {measure}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="status"
                        checked={formData.status}
                        onChange={(e) => setFormData({
                          ...formData,
                          status: e.target.checked
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="status" className="ml-2 block text-sm text-gray-700">
                        Produto Ativo
                      </label>
                    </div>
                  </div >
                </div >

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    {loading ? 'Processando...' : (editingId ? 'Atualizar' : 'Criar')}
                  </button>
                </div>
              </form >
            </div >
          </div >
        )}

        {/* Tabela de Produtos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código/Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preços
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {product.product_code}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.company_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.category}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Atual: {product.current_stock} {product.unit_measure}
                    </div>
                    <div className={`text-sm ${product.current_stock <= product.minimum_stock
                      ? 'text-red-600'
                      : 'text-gray-500'
                      }`}>
                      Mínimo: {product.minimum_stock} {product.unit_measure}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      Venda: {formatCurrency(product.selling_price)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Custo: {formatCurrency(product.cost_price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {product.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <HiPencil className="inline-block w-5 h-5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <HiTrash className="inline-block w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Indicador de carregamento */}
        {
          loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )
        }

        {/* Mensagem de nenhum resultado */}
        {
          filteredProducts.length === 0 && !loading && (
            <div className="text-center py-4 text-gray-500">
              Nenhum produto encontrado
            </div>
          )
        }
      </main >
    </div >
  );
}