"use client"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Auth from "@/utils/Auth"
import Image from "next/image"
import { toast } from "react-toastify"
import { useUser } from "@/contexts/UserContext"
import { getUserCompany } from "@/services/api"
import { HiHome, HiUsers, HiOfficeBuilding, HiUser, HiLogout } from "react-icons/hi"

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useUser()
  const router = useRouter()
  const isAdmin = Auth.isAdmin()
  const [userCompany, setUserCompany] = useState(null)

  useEffect(() => {
    const fetchUserCompany = async () => {
      try {
        const company = await getUserCompany()
        setUserCompany(company)
      } catch (error) {
        console.error("Erro ao buscar empresa do usuário:", error)
      }
    }

    if (user) {
      fetchUserCompany()
    }
  }, [user])

  const getInitials = (name) => {
    if (!name) return ""
    const names = name.split(" ")
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const handleLogout = () => {
    Auth.logout()
    toast.success("Logout realizado com sucesso!")
    router.push("/login")
  }

  const navigationLinks = [
    {
      name: "Início",
      icon: <HiHome className="w-6 h-6" />,
      onClick: () => router.push("/inicio"),
      requiresAdmin: false,
    },
    {
      name: "Funcionários",
      icon: <HiUsers className="w-6 h-6" />,
      onClick: () => router.push("/dashboard/funcionarios"),
      requiresAdmin: true,
    },
    {
      name: "Empresas",
      icon: <HiOfficeBuilding className="w-6 h-6" />,
      onClick: () => router.push("/dashboard/empresas"),
      requiresAdmin: true,
    },
    {
      name: "Perfil",
      icon: <HiUser className="w-6 h-6" />,
      onClick: () => router.push("/dashboard/perfil"),
      requiresAdmin: false,
    },
  ]

  return (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 overflow-y-auto transition-transform transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-center items-center h-16">
          <Image src="/logo.png" alt="Logo" width={120} height={40} className="object-contain" />
        </div>
      </div>

      <nav className="mt-4">
        <ul className="space-y-2">
          {navigationLinks.map(
            (link, index) =>
              (!link.requiresAdmin || isAdmin) && (
                <li key={index}>
                  <button
                    onClick={() => {
                      link.onClick()
                      onClose()
                    }}
                    className="w-full flex items-center px-4 py-2 text-white hover:bg-gray-700 transition-colors"
                  >
                    {link.icon}
                    <span className="ml-2">{link.name}</span>
                  </button>
                </li>
              ),
          )}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-700 p-4">
        <div className="px-4 py-2 border-b border-gray-700">
          <p className="text-sm text-gray-400">Empresa atual:</p>
          {userCompany ? (
            <p className="text-sm truncate text-white">{userCompany.name}</p>
          ) : (
            <p className="text-sm text-yellow-400">Não vinculado</p>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2 text-red-400 hover:bg-gray-700 transition-colors"
        >
          <HiLogout className="w-6 h-6" />
          <span className="ml-2">Sair</span>
        </button>
      </div>
    </div>
  )
}

