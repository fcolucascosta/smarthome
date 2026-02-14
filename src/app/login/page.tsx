'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push('/');
                router.refresh();
            } else {
                setError('Senha incorreta');
            }
        } catch {
            setError('Erro ao tentar login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[#111318]">
            <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-fade-in">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-normal text-[#E2E2E6] mb-2">SmartLife</h1>
                    <p className="text-[#C4C6D0]">Acesso Restrito</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Digite a senha..."
                            className="w-full h-14 pl-4 pr-12 rounded-2xl bg-[#1F1F23] text-[#E2E2E6] placeholder-[#8E9099] border border-[#44474F] focus:border-[#A8C7FA] focus:outline-none transition-colors text-lg"
                            autoFocus
                        />
                        <span className="material-symbols-outlined absolute right-4 top-4 text-[#8E9099]">lock</span>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-14 rounded-full bg-[#A8C7FA] text-[#062E6F] font-medium text-lg hover:bg-[#D6E3FF] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verificando...' : 'Entrar'}
                    </button>
                </form>

                {error && (
                    <div className="text-[#FFB4AB] bg-[#93000A]/30 px-4 py-2 rounded-lg text-sm animate-pulse">
                        {error}
                    </div>
                )}

            </div>
        </main>
    );
}
