import React, { useState } from 'react';
import { FileText, X, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils.ts';

interface Props {
    transactions: Transaction[];
    userEmail: string;
    theme: string;
}

export default function FloatingExpenseSummary({ transactions, userEmail, theme }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [isGenerating, setIsGenerating] = useState(false);

    // Group months that have transactions for the select dropdown
    const availableMonths = Array.from(
        new Set(transactions.map(t => t.date.substring(0, 7))) // 'YYYY-MM'
    ).sort((a, b) => b.localeCompare(a));

    // If no transactions, still allow generating for current month
    if (!availableMonths.includes(selectedMonth)) {
        availableMonths.unshift(selectedMonth);
    }

    const handleGeneratePDF = async () => {
        setIsGenerating(true);

        setTimeout(() => {
            const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));

            const doc = new jsPDF() as any;

            // Title
            doc.setFontSize(18);
            doc.text(`Resumo Financeiro - FluxoControl`, 14, 22);

            doc.setFontSize(11);
            doc.setTextColor(100);
            const [year, month] = selectedMonth.split('-');
            const monthName = format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy', { locale: ptBR });
            doc.text(`Período: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 30);
            doc.text(`Usuário: ${userEmail}`, 14, 36);

            // Summary Totals
            const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

            doc.setFontSize(12);
            doc.setTextColor(20);
            doc.text(`Entradas: R$ ${totalIncome.toFixed(2)}`, 14, 48);
            doc.text(`Saídas: R$ ${totalExpense.toFixed(2)}`, 14, 54);
            doc.text(`Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`, 14, 60);

            // Table Data
            const tableData = monthTransactions.sort((a, b) => b.date.localeCompare(a.date)).map(t => [
                t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '',
                t.description,
                t.category,
                t.type === 'income' ? 'Entrada' : 'Saída',
                `R$ ${t.amount.toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: 70,
                head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] } // emerald-600
            });

            doc.save(`Resumo_Financeiro_${selectedMonth}.pdf`);
            setIsGenerating(false);
            setIsOpen(false);
        }, 500);
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center z-40 hover:bg-emerald-700 transition-colors"
                title="Gerar PDF de Gastos"
            >
                <FileText size={24} />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setIsOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                    "rounded-2xl p-6 shadow-xl w-full max-w-sm border transition-all duration-300",
                                    theme === 'light' ? "bg-white border-zinc-100" : "bg-[#18181b] border-white/10"
                                )}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className={cn("text-xl font-bold flex items-center gap-2", theme === 'light' ? "text-zinc-900" : "text-white")}>
                                        <FileText className="text-emerald-600" />
                                        Exportar Resumo
                                    </h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className={cn("p-2 rounded-full transition-colors", theme === 'light' ? "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100" : "text-zinc-500 hover:text-white hover:bg-white/5")}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-sm text-zinc-600">
                                        Selecione o mês para gerar o relatório financeiro consolidado em PDF.
                                    </p>

                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                                            Mês / Ano
                                        </label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-zinc-50 font-medium"
                                        >
                                            {availableMonths.map((m) => {
                                                const [year, month] = m.split('-');
                                                const label = format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy', { locale: ptBR });
                                                return (
                                                    <option key={m} value={m}>
                                                        {label.charAt(0).toUpperCase() + label.slice(1)}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleGeneratePDF}
                                        disabled={isGenerating}
                                        className="w-full bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
                                    >
                                        {isGenerating ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            <Download size={20} />
                                        )}
                                        {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
