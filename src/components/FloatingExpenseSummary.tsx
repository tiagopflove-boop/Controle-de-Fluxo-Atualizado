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

        try {
            // Give CPU time to show loader
            await new Promise(resolve => setTimeout(resolve, 300));

            const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
            const doc = new jsPDF() as any;

            // Header Background
            doc.setFillColor(16, 185, 129); // emerald-600
            doc.rect(0, 0, 210, 40, 'F');

            // App name & Logo simulation
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('FluxoControl', 14, 25);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Resumo Financeiro Mensal', 14, 32);

            // Period info in Header
            const [year, month] = selectedMonth.split('-');
            const monthName = format(new Date(parseInt(year), parseInt(month) - 1, 1), 'MMMM yyyy', { locale: ptBR });
            doc.setFontSize(10);
            doc.text(`Período: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 150, 25);
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 150, 32);

            // Summary Section
            doc.setTextColor(20, 20, 20);
            doc.setFontSize(14);
            doc.text('Resumo de Movimentação', 14, 55);

            const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const balance = totalIncome - totalExpense;

            // Draw total cards
            doc.setDrawColor(240, 240, 240);
            doc.setFillColor(250, 250, 250);

            // Income card
            doc.roundedRect(14, 60, 58, 25, 3, 3, 'FD');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('ENTRADAS', 19, 68);
            doc.setFontSize(12);
            doc.setTextColor(16, 185, 129);
            doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome), 19, 78);

            // Expense card
            doc.roundedRect(76, 60, 58, 25, 3, 3, 'FD');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('SAÍDAS', 81, 68);
            doc.setFontSize(12);
            doc.setTextColor(225, 29, 72); // rose-600
            doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense), 81, 78);

            // Balance card
            doc.roundedRect(138, 60, 58, 25, 3, 3, 'FD');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('SALDO FINAL', 143, 68);
            doc.setFontSize(12);
            doc.setTextColor(balance >= 0 ? 30 : 225, balance >= 0 ? 30 : 29, balance >= 0 ? 30 : 72);
            doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance), 143, 78);

            // Table
            const tableData = monthTransactions
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(t => [
                    t.date ? format(parseISO(t.date), 'dd/MM/yyyy') : '',
                    t.description,
                    t.category,
                    t.type === 'income' ? 'Entrada' : 'Saída',
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)
                ]);

            autoTable(doc, {
                startY: 95,
                head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
                body: tableData,
                theme: 'striped',
                headStyles: {
                    fillColor: [16, 185, 129],
                    fontSize: 10,
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 25 },
                    3: { halign: 'center', cellWidth: 25 },
                    4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
                },
                styles: { fontSize: 9 }
            });

            // Footer
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `FluxoControl - Gestão Financeira Inteligente | Página ${i} de ${pageCount}`,
                    105,
                    290,
                    { align: 'center' }
                );
            }

            doc.save(`Resumo_Financeiro_${selectedMonth}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Ocorreu um erro ao gerar o PDF. Verifique os dados e tente novamente.');
        } finally {
            setIsGenerating(false);
            setIsOpen(false);
        }
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
