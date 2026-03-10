import React, { useRef } from 'react';
import { Moon, Sun, Image as ImageIcon, Upload, Palette } from 'lucide-react';
import { motion } from 'motion/react';

export type ThemeType = 'light' | 'dark' | 'custom';

interface Props {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
    customBg: string | null;
    setCustomBg: (bg: string | null) => void;
}

export default function ThemeSettings({ theme, setTheme, customBg, setCustomBg }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("A imagem de fundo é muito grande. Escolha uma imagem menor que 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setCustomBg(base64String);
                setTheme('custom');
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex items-center gap-0.5 sm:gap-2 bg-zinc-100 p-0.5 sm:p-1 rounded-xl border border-zinc-200">
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                title="Tema Claro"
            >
                <Sun size={18} />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                title="Tema Escuro"
            >
                <Moon size={18} />
            </button>
            <div className="w-px h-4 bg-zinc-300 mx-1" />
            <button
                onClick={() => {
                    if (customBg) setTheme('custom');
                    else fileInputRef.current?.click();
                }}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 ${theme === 'custom' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                title="Fundo Personalizado"
            >
                {customBg ? <ImageIcon size={18} /> : <Upload size={18} />}
                {theme === 'custom' && <span className="text-xs font-bold px-1">Ativo</span>}
            </button>

            {customBg && (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-zinc-500 hover:text-emerald-600 transition-all"
                    title="Alterar Imagem"
                >
                    <Palette size={18} />
                </button>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
