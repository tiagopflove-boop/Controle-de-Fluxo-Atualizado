import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth({ onLogin }: { onLogin: () => void }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            if (!isLogin) {
                alert('Cadastro realizado! Por favor, faça login.');
                setIsLogin(true);
                setLoading(false);
            } else {
                onLogin();
            }
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white mb-4">
                        <Wallet size={24} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">FluxoControl</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {isLogin ? 'Entre na sua conta para continuar' : 'Crie sua conta para começar'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Email</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 pl-10 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                placeholder="seu@email.com"
                                required
                            />
                            <Mail className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 pl-10 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                            <Lock className="absolute left-3 top-2.5 text-zinc-400" size={18} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-500 mt-6">
                    {isLogin ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="font-semibold text-emerald-600 hover:underline ml-1"
                    >
                        {isLogin ? 'Cadastre-se' : 'Faça login'}
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
