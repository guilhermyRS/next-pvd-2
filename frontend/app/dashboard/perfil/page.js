'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function Perfil() {
    const router = useRouter();
    const { user, updateUser, triggerRefresh } = useUser();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Função para gerar iniciais
    const getInitials = (name) => {
        if (!name) return '';
        const names = name.split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const loadProfile = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const userData = await response.json();
                setFormData({
                    fullName: userData.fullName || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setPreviewImage(userData.avatar ? `http://localhost:3001/${userData.avatar}` : null);
                updateUser(userData); // Atualiza o contexto
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPreviewImage(user.avatar ? `http://localhost:3001/${user.avatar}` : null);
            setLoading(false);
        } else {
            loadProfile();
        }
    }, [user]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3001/api/profile/remove-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setPreviewImage(null);
                setSelectedImage(null);
                updateUser(userData); // Atualiza o contexto
                triggerRefresh(); // Dispara atualização global
                toast.success('Foto removida com sucesso');
            } else {
                toast.error('Erro ao remover foto');
            }
        } catch (error) {
            console.error('Erro ao remover foto:', error);
            toast.error('Erro ao remover foto');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        try {
            setLoading(true);
            
            const submitFormData = new FormData();
            submitFormData.append('fullName', formData.fullName);
            submitFormData.append('email', formData.email);
            submitFormData.append('phone', formData.phone);
            
            if (formData.newPassword) {
                submitFormData.append('currentPassword', formData.currentPassword);
                submitFormData.append('newPassword', formData.newPassword);
            }

            if (selectedImage) {
                submitFormData.append('avatar', selectedImage);
            }

            const response = await fetch('http://localhost:3001/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: submitFormData
            });

            if (response.ok) {
                const updatedUser = await response.json();
                updateUser(updatedUser); // Atualiza o contexto
                triggerRefresh(); // Dispara atualização global
                setIsEditing(false);
                setSelectedImage(null);
                toast.success('Perfil atualizado com sucesso!');
            } else {
                const error = await response.json();
                toast.error(error.message);
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            toast.error('Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedImage(null);
        setPreviewImage(user.avatar ? `http://localhost:3001/${user.avatar}` : null);
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Erro ao carregar dados do perfil</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Meu Perfil</h1>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col items-center space-y-4 mb-6">
                    <div className="relative w-32 h-32">
                        {previewImage ? (
                            <div className="relative w-32 h-32 rounded-full overflow-hidden">
                                <Image
                                    src={previewImage}
                                    alt="Foto de perfil"
                                    fill
                                    className="rounded-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-4xl text-gray-500">
                                    {getInitials(user?.fullName)}
                                </span>
                            </div>
                        )}
                    </div>
                    {isEditing && (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                disabled={loading}
                            >
                                Alterar foto
                            </button>
                            {previewImage && (
                                <button
                                    onClick={handleRemovePhoto}
                                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
                                    disabled={loading}
                                >
                                    Remover foto
                                </button>
                            )}
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Telefone
                            </label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>

                        <div className="border-t pt-4 mt-4">
                            <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Senha Atual
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Nova Senha
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Confirmar Nova Senha
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome Completo
                            </label>
                            <p className="mt-1 text-lg">{user.fullName}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nome de Usuário
                            </label>
                            <p className="mt-1 text-lg">{user.username}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <p className="mt-1 text-lg">{user.email}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Telefone
                            </label>
                            <p className="mt-1 text-lg">{user.phone || '-'}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Tipo de Usuário
                            </label>
                            <p className="mt-1 text-lg capitalize">
                                {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Editar Perfil
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}