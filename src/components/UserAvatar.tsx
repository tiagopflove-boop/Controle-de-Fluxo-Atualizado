import React, { useRef, useState } from 'react';
import { User as UserIcon, Camera, Edit2, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
    avatar: string | null;
    setAvatar: (avatar: string | null) => void;
    theme: string;
    userName: string;
    setUserName: (name: string) => void;
}

export default function UserAvatar({ avatar, setAvatar, theme, userName, setUserName }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(userName);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("A imagem é muito grande. Escolha uma imagem menor que 2MB.");
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

    const handleSaveName = () => {
        setUserName(tempName || 'Usuário');
        setIsEditingName(false);
    };

    return (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative group shrink-0">
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                        "w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 overflow-hidden flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95",
                        theme === 'light' ? "border-white bg-zinc-100 shadow-sm" : "border-white/10 bg-white/5",
                        avatar ? "border-emerald-500" : ""
                    )}
                >
                    {avatar ? (
                        <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className={theme === 'light' ? "text-zinc-400" : "text-white/40"} size={18} />
                    )}
                </div>

                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-md flex items-center justify-center border border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <Camera size={8} />
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            <div className="flex flex-col min-w-0">
                {isEditingName ? (
                    <div className="flex items-center gap-1 group/input">
                        <input
                            autoFocus
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            className={cn(
                                "text-sm font-bold bg-transparent border-b border-emerald-500 focus:outline-none w-20 sm:w-24",
                                theme === 'light' ? "text-zinc-900" : "text-white"
                            )}
                        />
                        <Check size={14} className="text-emerald-500 cursor-pointer shrink-0" onClick={handleSaveName} />
                    </div>
                ) : (
                    <div
                        onClick={() => { setIsEditingName(true); setTempName(userName); }}
                        className="flex items-center gap-1 cursor-pointer group/name min-w-0"
                    >
                        <span className={cn(
                            "text-xs sm:text-sm font-bold tracking-tight truncate max-w-[70px] min-[400px]:max-w-[100px] sm:max-w-[150px]",
                            theme === 'light' ? "text-zinc-900" : "text-white"
                        )}>
                            {userName}
                        </span>
                        <Edit2 size={10} className="opacity-0 group-hover/name:opacity-50 transition-opacity shrink-0" />
                    </div>
                )}
            </div>
        </div>
    );
}
