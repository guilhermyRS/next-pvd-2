'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer } from 'react-toastify';
import Auth from '@/utils/Auth';
import Sidebar from '@/components/Sidebar';
import { UserProvider } from '@/contexts/UserContext';
import 'react-toastify/dist/ReactToastify.css';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (!Auth.isAuthenticated()) {
      router.push('/login');
    }
  }, []);

  if (!isClient) return null;

  return (
    <UserProvider> {/* Adicione o UserProvider aqui */}
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 ml-64">
          <main className="p-8">
            {children}
          </main>
        </div>
        <ToastContainer />
      </div>
    </UserProvider>
  );
}