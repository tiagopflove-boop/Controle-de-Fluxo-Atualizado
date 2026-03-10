import React, { useRef } from 'react';
import { User, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    avatar: string | null;
    setAvatar: (avatar: string | null) => void;
    theme: string;
}

export default function UserAvatar({ avatar, setAvatar, theme }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit for localStorage
                alert("A imagem é muito grande. Escolha uma imagem menor que 1MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setAvatar(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="relative group">
            <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "w-10 h-10 rounded-full border-2 overflow-hidden flex items-center justify-center cursor-pointer transition-all hover:ring-4 hover:ring-emerald-500/20",
                    theme === 'light' ? "border-white bg-zinc-100" : "border-white/20 bg-white/5",
                    avatar ? "border-emerald-500" : ""
                )}
            >
                {avatar ? (
                    <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                    <User className={theme === 'light' ? "text-zinc-400" : "text-white/40"} size={20} />
                )}
            </div>

            <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                title="Trocar Avatar"
            >
                <Camera size={10} />
            </button>

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
