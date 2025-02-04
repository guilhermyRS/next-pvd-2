'use client';
import { useRouter } from 'next/navigation';

export default function Unauthorized() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">
                    Acesso Negado
                </h1>
                <p className="text-gray-600 mb-4">
                    Você não tem permissão para acessar esta página.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Voltar ao Dashboard
                </button>
            </div>
        </div>
    );
}