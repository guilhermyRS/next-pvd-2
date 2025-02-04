'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '@/utils/Auth';

export default function Dashboard() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard/perfil');
    }, []);

    return null;
}