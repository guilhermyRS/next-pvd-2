'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '@/utils/Auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (Auth.isAuthenticated()) {
      router.push('/dashboard/funcionarios');
    } else {
      router.push('/login');
    }
  }, []);

  return null;
}