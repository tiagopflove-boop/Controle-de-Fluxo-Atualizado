import { 
  Wifi,
  Droplets,
  Zap,
  Fuel,
  Phone,
  CreditCard,
  ShoppingBag,
  Stethoscope,
  PlayCircle,
  Heart,
  Gamepad2,
  PlusCircle,
  Coins,
  TrendingUp,
  MoreHorizontal,
  LucideIcon
} from 'lucide-react';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: TransactionType;
}

export interface CategoryDef {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  type: TransactionType;
}

export interface Budget {
  categoryId: string;
  amount: number;
}

export const CATEGORIES: CategoryDef[] = [
  // Despesas
  { id: 'internet', name: 'Internet', icon: Wifi, color: '#3b82f6', type: 'expense' },
  { id: 'water', name: 'Agua', icon: Droplets, color: '#0ea5e9', type: 'expense' },
  { id: 'electricity', name: 'Luz', icon: Zap, color: '#eab308', type: 'expense' },
  { id: 'fuel', name: 'Combustível', icon: Fuel, color: '#f97316', type: 'expense' },
  { id: 'phone', name: 'Telefone', icon: Phone, color: '#6366f1', type: 'expense' },
  { id: 'nubank', name: 'Fatura Nubank', icon: CreditCard, color: '#8a05be', type: 'expense' },
  { id: 'hipercard', name: 'Fatura Hipercard', icon: CreditCard, color: '#ef4444', type: 'expense' },
  { id: 'ml', name: 'Fatura ML', icon: ShoppingBag, color: '#facc15', type: 'expense' },
  { id: 'dental', name: 'Plano Odontológico', icon: Stethoscope, color: '#10b981', type: 'expense' },
  { id: 'streaming', name: 'Streaming', icon: PlayCircle, color: '#ec4899', type: 'expense' },
  { id: 'donations', name: 'Donativos', icon: Heart, color: '#f43f5e', type: 'expense' },
  { id: 'leisure', name: 'Lazer', icon: Gamepad2, color: '#8b5cf6', type: 'expense' },
  { id: 'extras', name: 'Extras', icon: PlusCircle, color: '#71717a', type: 'expense' },
  
  // Receitas
  { id: 'salary', name: 'Salário', icon: Coins, color: '#10b981', type: 'income' },
  { id: 'others_inc', name: 'Outros (Entrada)', icon: TrendingUp, color: '#06b6d4', type: 'income' },
];
