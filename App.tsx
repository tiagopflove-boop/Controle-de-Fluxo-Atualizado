/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  PlusCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Trash2,
  Calendar,
  PieChart as PieChartIcon,
  TrendingUp,
  Filter,
  Target,
  MoreHorizontal,
  LogOut
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Cell,
  Pie
} from 'recharts';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction, TransactionType, CATEGORIES, Budget } from './types';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import FloatingExpenseSummary from './components/FloatingExpenseSummary';
import ThemeSettings, { ThemeType } from './components/ThemeSettings';
import UserAvatar from './components/UserAvatar';

import { cn } from './lib/utils';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>(
    CATEGORIES.map(cat => ({ categoryId: cat.id, amount: 0 }))
  );

  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES.find(c => c.type === 'expense')?.id || '');
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Theme State
  const [theme, setTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('theme') as ThemeType) || 'light';
  });
  const [customBg, setCustomBg] = useState<string | null>(() => {
    return localStorage.getItem('customBg');
  });
  const [avatar, setAvatar] = useState<string | null>(() => {
    return localStorage.getItem('userAvatar');
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('userProfileName') || 'Usuário';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (customBg) localStorage.setItem('customBg', customBg);
    else localStorage.removeItem('customBg');
  }, [customBg]);

  useEffect(() => {
    if (avatar) localStorage.setItem('userAvatar', avatar);
    else localStorage.removeItem('userAvatar');
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('userProfileName', userName);
  }, [userName]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      setTransactions([]);
      setLoadingData(false);
    }
  }, [session]);

  // Mobile Optimizations (Status Bar & Back Button)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // 1. Sync Status Bar with Theme
      const updateStatusBar = async () => {
        try {
          if (theme === 'dark') {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#09090b' }); // zinc-950 approx
          } else {
            await StatusBar.setStyle({ style: Style.Light });
            await StatusBar.setBackgroundColor({ color: '#ffffff' });
          }
        } catch (e) {
          console.error('StatusBar error:', e);
        }
      };

      updateStatusBar();

      // 2. Handle Back Button
      const backListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });

      return () => {
        backListener.then(l => l.remove());
      };
    }
  }, [theme]);

  const fetchData = async () => {
    setLoadingData(true);
    if (!session) return;

    // Fetch transactions
    const { data: txs } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (txs) setTransactions(txs as Transaction[]);

    // Fetch budgets
    const { data: bgs } = await supabase
      .from('budgets')
      .select('*');

    if (bgs && bgs.length > 0) {
      const mergedBudgets = CATEGORIES.map(cat => {
        const found = bgs.find(b => b.category_id === cat.id);
        return { categoryId: cat.id, amount: found ? found.amount : 0 };
      });
      setBudgets(mergedBudgets);
    }

    setLoadingData(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const totals = useMemo(() => {
    return transactions.reduce((acc, curr) => {
      if (curr.type === 'income') acc.income += curr.amount;
      else acc.expense += curr.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const balance = totals.income - totals.expense;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !session) return;

    const category = CATEGORIES.find(c => c.id === categoryId)?.name || 'Outros';

    const newTx = {
      user_id: session.user.id,
      description,
      amount: parseFloat(amount),
      category,
      type,
      date,
    };

    const { data, error } = await supabase.from('transactions').insert(newTx).select().single();

    if (!error && data) {
      setTransactions([data as Transaction, ...transactions].sort((a, b) => b.date.localeCompare(a.date)));
      setDescription('');
      setAmount('');
    }
  };

  const removeTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const updateBudget = async (catId: string, amt: number) => {
    if (!session) return;

    const { error } = await supabase.from('budgets').upsert({
      user_id: session.user.id,
      category_id: catId,
      amount: amt
    }, { onConflict: 'user_id, category_id' });

    if (!error) {
      setBudgets(prev => prev.map(b =>
        b.categoryId === catId ? { ...b, amount: amt } : b
      ));
    }
  };

  const chartData = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });

    let cumulative = 0;
    return days.map(day => {
      const dayTransactions = transactions.filter(t =>
        isSameDay(parseISO(t.date), day) && t.type === 'expense'
      );
      const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      cumulative += dayTotal;

      return {
        date: format(day, 'dd/MM'),
        amount: dayTotal,
        cumulative: cumulative
      };
    });
  }, [transactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const getSpentByCategory = (catName: string) => {
    return transactions
      .filter(t => t.category === catName)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (!session) {
    return <Auth onLogin={fetchData} />;
  }

  const getBackgroundStyle = () => {
    if (theme === 'dark') return { backgroundColor: '#09090b' };
    if (theme === 'custom' && customBg) return {
      backgroundImage: `url(${customBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    };
    return { backgroundColor: '#f8f8f8' }; // Default light
  };

  return (
    <div
      className={cn(
        "min-h-screen pb-12 transition-all duration-500",
        theme === 'dark' ? "text-white" : "text-zinc-900"
      )}
      style={getBackgroundStyle()}
    >
      <header
        className={cn(
          "border-b sticky top-0 z-10 transition-colors duration-500",
          theme === 'light' ? "bg-white border-zinc-200" : "bg-black/20 backdrop-blur-xl border-white/10"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatar={avatar}
              setAvatar={setAvatar}
              theme={theme}
              userName={userName}
              setUserName={setUserName}
            />
            <div className="flex flex-col -space-y-1">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider opacity-50", theme === 'light' ? "text-zinc-500" : "text-white")}>Sistema</span>
              <h1 className={cn("text-lg font-bold tracking-tight", theme === 'light' ? "text-zinc-900" : "text-white")}>FluxoControl</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSettings
              theme={theme}
              setTheme={setTheme}
              customBg={customBg}
              setCustomBg={setCustomBg}
            />

            <div className="hidden sm:flex text-sm font-medium text-zinc-500 items-center gap-2">
              <Calendar size={16} />
              {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <button onClick={handleSignOut} className={cn("text-sm font-medium flex items-center gap-1 transition-colors", theme === 'light' ? "text-zinc-500 hover:text-zinc-900" : "text-white/60 hover:text-white")}>
              <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("p-6 rounded-2xl border shadow-sm transition-all", theme === 'light' ? "bg-white border-zinc-200" : "bg-white/5 backdrop-blur-lg border-white/10")}>
            <div className="flex items-center justify-between mb-4">
              <span className={cn("text-sm font-medium", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>Entradas</span>
              <ArrowUpCircle className="text-emerald-500" size={24} />
            </div>
            <p className={cn("text-2xl font-bold", theme === 'light' ? "text-zinc-900" : "text-white")}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.income)}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cn("p-6 rounded-2xl border shadow-sm transition-all", theme === 'light' ? "bg-white border-zinc-200" : "bg-white/5 backdrop-blur-lg border-white/10")}>
            <div className="flex items-center justify-between mb-4">
              <span className={cn("text-sm font-medium", theme === 'light' ? "text-zinc-500" : "text-zinc-400")}>Saídas</span>
              <ArrowDownCircle className="text-rose-500" size={24} />
            </div>
            <p className={cn("text-2xl font-bold", theme === 'light' ? "text-zinc-900" : "text-white")}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.expense)}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={cn("p-6 rounded-2xl border shadow-sm", balance >= 0 ? "bg-emerald-600 border-emerald-500 text-white" : "bg-rose-600 border-rose-500 text-white")}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium opacity-80">Saldo Total</span>
              <Wallet size={24} />
            </div>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-8">
            <section className={cn("p-6 rounded-2xl border shadow-sm transition-all", theme === 'light' ? "bg-white border-zinc-200" : "bg-white/5 backdrop-blur-lg border-white/10")}>
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <PlusCircle size={20} className="text-emerald-600" />
                Nova Transação
              </h2>
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Aluguel, Supermercado..." className={cn("w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all", theme === 'light' ? "border-zinc-200 bg-white" : "border-white/10 bg-white/5 text-white")} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className={cn("w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all", theme === 'light' ? "border-zinc-200 bg-white" : "border-white/10 bg-white/5 text-white")} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoria</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={cn("w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all", theme === 'light' ? "border-zinc-200 bg-white" : "border-white/10 bg-zinc-800 text-white")}>
                    {CATEGORIES.filter(c => c.type === type).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Data</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn("w-full px-4 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all", theme === 'light' ? "border-zinc-200 bg-white" : "border-white/10 bg-white/5 text-white")} />
                </div>
                <div className="sm:col-span-2 flex gap-4 pt-2">
                  <button type="button" onClick={() => { setType('income'); setCategoryId(CATEGORIES.find(c => c.type === 'income')?.id || ''); }} className={cn("flex-1 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border", type === 'income' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50")}>
                    <ArrowUpCircle size={18} /> Entrada
                  </button>
                  <button type="button" onClick={() => { setType('expense'); setCategoryId(CATEGORIES.find(c => c.type === 'expense')?.id || ''); }} className={cn("flex-1 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border", type === 'expense' ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-zinc-200 text-zinc-500 hover:bg-zinc-50")}>
                    <ArrowDownCircle size={18} /> Saída
                  </button>
                </div>
                <button type="submit" className="sm:col-span-2 w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-all mt-2 shadow-lg shadow-zinc-200">
                  Adicionar Transação
                </button>
              </form>
            </section>

            <section className={cn("rounded-2xl border shadow-sm overflow-hidden transition-all", theme === 'light' ? "bg-white border-zinc-200" : "bg-white/5 backdrop-blur-lg border-white/10")}>
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter size={20} className="text-zinc-400" />
                  Transações Recentes
                </h2>
              </div>
              <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
                {loadingData ? (
                  <div className="p-12 text-center text-zinc-400 animate-pulse">Carregando transações...</div>
                ) : (
                  <AnimatePresence initial={false}>
                    {transactions.length === 0 ? (
                      <div className="p-12 text-center text-zinc-400">
                        <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Nenhuma transação registrada ainda.</p>
                      </div>
                    ) : (
                      transactions.map((t) => {
                        const catDef = CATEGORIES.find(c => c.name === t.category);
                        const Icon = catDef?.icon || MoreHorizontal;
                        return (
                          <motion.div key={t.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={cn("p-4 flex items-center justify-between transition-colors group", theme === 'light' ? "hover:bg-zinc-50" : "hover:bg-white/5")}>
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${catDef?.color}15`, color: catDef?.color }}>
                                <Icon size={20} />
                              </div>
                              <div>
                                <p className={cn("font-semibold", theme === 'light' ? "text-zinc-900" : "text-white")}>{t.description}</p>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                  <span className={cn("px-2 py-0.5 rounded-md", theme === 'light' ? "bg-zinc-100" : "bg-white/10 text-white/70")}>{t.category}</span>
                                  <span>•</span>
                                  <span>{t.date ? format(parseISO(t.date), 'dd MMM', { locale: ptBR }) : ''}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className={cn("font-bold", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                              </p>
                              <button onClick={() => removeTransaction(t.id)} className="p-2 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </AnimatePresence>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <section className={cn("rounded-2xl border shadow-sm overflow-hidden transition-all", theme === 'light' ? "bg-white border-zinc-200" : "bg-white/5 backdrop-blur-lg border-white/10")}>
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Target size={20} className="text-emerald-600" />
                  Categorias e Orçamento
                </h2>
                <div className="flex p-1 bg-zinc-100 rounded-xl">
                  <button
                    onClick={() => setActiveTab('expense')}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      activeTab === 'expense' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    Despesas
                  </button>
                  <button
                    onClick={() => setActiveTab('income')}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                      activeTab === 'income' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                  >
                    Receitas
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                {CATEGORIES.filter(c => c.type === activeTab).map(cat => {
                  const Icon = cat.icon;
                  const budget = budgets.find(b => b.categoryId === cat.id)?.amount || 0;
                  const spent = getSpentByCategory(cat.name);
                  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                  const isOverBudget = budget > 0 && spent > budget;

                  return (
                    <div key={cat.id} className={cn("p-4 rounded-xl border transition-all", theme === 'light' ? "bg-zinc-50/50 border-zinc-100 hover:border-zinc-200" : "bg-white/5 border-white/10 hover:border-white/20")}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color, color: 'white' }}>
                            <Icon size={16} />
                          </div>
                          <span className={cn("font-medium", theme === 'light' ? "text-zinc-900" : "text-white")}>{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-400 uppercase">Orçamento:</span>
                          <input
                            type="number"
                            value={budget || ''}
                            onChange={(e) => updateBudget(cat.id, parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-20 text-right text-sm font-bold bg-transparent border-b border-zinc-200 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">
                            {activeTab === 'expense' ? 'Gasto' : 'Recebido'}:
                            <span className={cn("font-bold ml-1", isOverBudget ? "text-rose-600" : "text-zinc-900")}>
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)}
                            </span>
                          </span>
                          <span className="text-zinc-400">
                            {budget > 0 ? `${progress.toFixed(0)}%` : 'Sem meta'}
                          </span>
                        </div>
                        {budget > 0 && (
                          <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className={cn(
                                "h-full rounded-full",
                                isOverBudget ? "bg-rose-500" : "bg-emerald-500"
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={cn("p-6 rounded-2xl border shadow-sm transition-all", theme === 'light' ? "bg-white border-zinc-200" : "bg-white/5 backdrop-blur-lg border-white/10")}>
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" />
                Consumo Gradativo
              </h2>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'light' ? "#f4f4f5" : "rgba(255,255,255,0.1)"} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} interval={Math.floor(chartData.length / 5)} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Acumulado']} />
                    <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className={cn("p-6 rounded-2xl border shadow-sm transition-all", theme === 'light' ? "bg-white border-zinc-200" : "bg-white/5 backdrop-blur-lg border-white/10")}>
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <PieChartIcon size={20} className="text-emerald-600" />
                Gastos por Categoria
              </h2>
              <div className="min-h-[200px] w-full flex flex-col md:flex-row items-center gap-6">
                {categoryData.length > 0 ? (
                  <>
                    <div className="h-[200px] w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {categoryData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                            <span className={cn("font-medium", theme === 'light' ? "text-zinc-600" : "text-zinc-400")}>{entry.name}</span>
                          </div>
                          <span className={cn("font-bold", theme === 'light' ? "text-zinc-900" : "text-white")}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-400 text-sm py-12">Sem dados de gastos para exibir.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <FloatingExpenseSummary transactions={transactions} userEmail={session.user.email} theme={theme} />
    </div>
  );
}
