"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Auth from "@/utils/Auth"
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
  createProductCategory,
  getCompanies,
} from "@/services/api"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

export default function Products() {
  const router = useRouter()
  const [companies, setCompanies] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [company, setCompany] = useState(null)
  const [newCategory, setNewCategory] = useState("")
  const [stockAddition, setStockAddition] = useState("")
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    cost_price: "",
    selling_price: "",
    profit_margin: "",
    category_id: "",
    current_stock: "",
    minimum_stock: "",
    unit: "",
    company_id: "",
  })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  //const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!Auth.isAdmin()) {
      router.push("/dashboard")
      return
    }
    loadInitialData()
  }, [router, Auth]) // Added router and Auth to dependencies

  const loadInitialData = async () => {
    try {
      const [companiesData, categoriesData] = await Promise.all([getCompanies(), getProductCategories()])

      setCompanies(companiesData)
      setCategories(categoriesData)

      if (companiesData && companiesData.length > 0) {
        const productsData = await getProducts(companiesData[0].id)
        setProducts(productsData)
        setFormData((prev) => ({ ...prev, company_id: companiesData[0].id }))
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast.error("Erro ao carregar dados iniciais")
    }
  }

  const calculateProfitMargin = (cost, selling) => {
    if (!cost || !selling) return ""
    const margin = ((selling - cost) / cost) * 100
    return margin.toFixed(2)
  }

  const calculateSellingPrice = (cost, margin) => {
    if (!cost || !margin) return ""
    const selling = cost * (1 + margin / 100)
    return selling.toFixed(2)
  }

  const handlePriceChange = (field, value) => {
    const numValue = Number.parseFloat(value) || 0
    const updates = { ...formData, [field]: value }

    if (field === "cost_price" && formData.profit_margin) {
      updates.selling_price = calculateSellingPrice(numValue, Number.parseFloat(formData.profit_margin))
    } else if (field === "cost_price" && formData.selling_price) {
      updates.profit_margin = calculateProfitMargin(numValue, Number.parseFloat(formData.selling_price))
    } else if (field === "selling_price" && formData.cost_price) {
      updates.profit_margin = calculateProfitMargin(Number.parseFloat(formData.cost_price), numValue)
    } else if (field === "profit_margin" && formData.cost_price) {
      updates.selling_price = calculateSellingPrice(Number.parseFloat(formData.cost_price), numValue)
    }

    setFormData(updates)
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      await createProductCategory({ name: newCategory })
      const categoriesData = await getProductCategories()
      setCategories(categoriesData)
      setNewCategory("")
      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("Erro ao criar categoria")
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    //setErrorMessage("")

    try {
      const productData = {
        code: formData.code,
        name: formData.name,
        cost_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        profit_margin: Number(formData.profit_margin),
        current_stock: editingId
          ? Number(formData.current_stock) + (Number(stockAddition) || 0)
          : Number(formData.current_stock),
        minimum_stock: Number(formData.minimum_stock),
        category_id: Number(formData.category_id),
        company_id: Number(formData.company_id),
        unit: formData.unit,
      }

      if (selectedFile) {
        productData.image = selectedFile
      }

      if (editingId) {
        await updateProduct(editingId, productData)
      } else {
        await createProduct(productData)
      }

      // Reset form
      setFormData({
        code: "",
        name: "",
        cost_price: "",
        selling_price: "",
        profit_margin: "",
        category_id: "",
        current_stock: "",
        minimum_stock: "",
        unit: "",
        company_id: companies[0]?.id || "",
      })
      setStockAddition("")
      setEditingId(null)
      setIsModalOpen(false)
      setSelectedFile(null)
      setPreviewImage(null)
      await loadInitialData()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Erro ao salvar produto")
    }
    setLoading(false)
  }

  const handleCompanyChange = async (companyId) => {
    try {
      const productsData = await getProducts(companyId)
      setProducts(productsData)
      setFormData((prev) => ({ ...prev, company_id: companyId }))
    } catch (error) {
      console.error("Error loading company products:", error)
      toast.error("Erro ao carregar produtos da empresa")
    }
  }

  const handleEdit = (product) => {
    setFormData({
      code: product.code,
      name: product.name,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      profit_margin: product.profit_margin,
      category_id: product.category_id,
      current_stock: product.current_stock,
      minimum_stock: product.minimum_stock,
      unit: product.unit,
      company_id: product.company_id,
    })
    setStockAddition("")
    setEditingId(product.id)
    if (product.image) {
      setPreviewImage(`http://localhost:3001/${product.image}`)
    } else {
      setPreviewImage(null)
    }
    setSelectedFile(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      try {
        await deleteProduct(id)
        await loadInitialData()
      } catch (error) {
        console.error("Error deleting product:", error)
        toast.error("Erro ao excluir produto")
      }
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/*<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{errorMessage}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg
              onClick={() => setErrorMessage("")}
              className="fill-current h-6 w-6 text-red-500"
              role="button"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z" />
            </svg>
          </span>
        </div>*/}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Produtos</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Novo Produto
        </button>
      </div>
      {/* Modal de Produto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingId ? "Editar Produto" : "Novo Produto"}</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setFormData({
                    code: "",
                    name: "",
                    cost_price: "",
                    selling_price: "",
                    profit_margin: "",
                    category_id: "",
                    current_stock: "",
                    minimum_stock: "",
                    unit: "",
                    company_id: "",
                  })
                  setEditingId(null)
                  setPreviewImage(null)
                  setSelectedFile(null)
                  //setErrorMessage("")
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Empresa</label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Código</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor de Custo</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => handlePriceChange("cost_price", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Valor de Venda</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => handlePriceChange("selling_price", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Margem de Lucro (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.profit_margin}
                    onChange={(e) => handlePriceChange("profit_margin", e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Categoria</label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="mt-1 bg-green-500 text-white px-3 rounded-md hover:bg-green-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estoque Atual</label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                    disabled
                  />
                </div>
                {editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adicionar ao Estoque</label>
                    <input
                      type="number"
                      value={stockAddition}
                      onChange={(e) => setStockAddition(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Quantidade a adicionar"
                    />
                  </div>
                )}

                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade Inicial</label>
                    <input
                      type="number"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estoque Mínimo</label>
                  <input
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unidade</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Imagem do Produto</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100"
                  />
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                {/* Preview da imagem */}
                {previewImage && (
                  <div className="mt-4">
                    <img
                      src={previewImage || "/placeholder.svg"}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-md mx-auto md:mx-0"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 col-span-1 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      setFormData({
                        code: "",
                        name: "",
                        cost_price: "",
                        selling_price: "",
                        profit_margin: "",
                        category_id: "",
                        current_stock: "",
                        minimum_stock: "",
                        unit: "",
                        company_id: "",
                      })
                      setEditingId(null)
                      setPreviewImage(null)
                      setSelectedFile(null)
                    }}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${
                      loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                    } text-white py-2 px-4 rounded-md transition duration-200`}
                  >
                    {loading ? "Processando..." : editingId ? "Atualizar" : "Criar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nova Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nova Categoria</h2>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false)
                  setNewCategory("")
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false)
                    setNewCategory("")
                  }}
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço de Custo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço de Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-10 w-10">
                      {product.image ? (
                        <Image
                          src={`http://localhost:3001/${product.image}`}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                          priority
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-500 text-xs">Sem foto</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R$ {Number.parseFloat(product.cost_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R$ {Number.parseFloat(product.selling_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.profit_margin}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span>{product.current_stock}</span>
                      {product.current_stock <= product.minimum_stock && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Baixo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

