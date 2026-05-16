import { useEffect, useRef, useState } from 'react';
import { Mail, Monitor, BookOpen, AlertTriangle } from 'lucide-react';

export function FakeUIScaledWrapper({ uiType, uiTypesData = [], children, className = '', ...props }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver((entries) => {
            if (entries[0] && entries[0].contentRect.width > 0) {
                // The base design is 800px wide
                setScale(entries[0].contentRect.width / 800);
            }
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full aspect-video bg-[#e0e0e0] overflow-hidden ring-1 ring-black/10 origin-top-left ${className}`}
            {...props}
        >
            <div 
                className="absolute top-0 left-0" 
                style={{ 
                    width: '800px', 
                    height: '450px', 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top left' 
                }}
            >
                <FakeUIBackground uiType={uiType} uiTypesData={uiTypesData}>
                    {children}
                </FakeUIBackground>
            </div>
        </div>
    );
}

export function FakeUIBackground({ uiType, uiTypesData = [], children }) {
    // Check if it's a dynamically managed UI Type first
    const dynamicType = uiTypesData?.find(t => t.key_name === uiType);
    
    if (dynamicType) {
        if (dynamicType.image_url) {
            if (dynamicType.is_scrollable) {
                return (
                    <div 
                        className="absolute inset-0 bg-white overflow-y-auto overflow-x-hidden pointer-events-auto vn-scroll-container"
                        onPointerDown={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (e.clientX > rect.right - 20) {
                                e.stopPropagation();
                            }
                        }}
                        onClick={(e) => {
                            // If clicking near scrollbar, definitely stop it
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (e.clientX > rect.right - 20) {
                                e.stopPropagation();
                            }
                        }}
                    >
                        <div className="relative w-full" style={{ minHeight: '100%' }}>
                            <img 
                                src={dynamicType.image_url} 
                                alt="Background" 
                                className="w-full h-auto block"
                                style={{ pointerEvents: 'none' }}
                            />
                            {/* Overlay for targets - Must be same size as image content */}
                            <div className="absolute inset-0 pointer-events-none">
                                {children}
                            </div>
                        </div>
                    </div>
                );
            }
            
            // Standard non-scrollable background
            const bgStyle = {
                backgroundImage: `url('${dynamicType.image_url}')`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${dynamicType.bg_offset_y || 0}%`,
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100%',
            };
            return (
                <div className="absolute inset-0 bg-white overflow-hidden">
                    <div style={bgStyle} className="w-full h-full" />
                    <div className="absolute inset-0 pointer-events-none">
                        {children}
                    </div>
                </div>
            );
        }
        
        if (dynamicType.custom_html) {
            return (
                <div className="absolute inset-0 bg-white overflow-hidden">
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: dynamicType.custom_html }} />
                    <div className="absolute inset-0 pointer-events-none">
                        {children}
                    </div>
                </div>
            );
        }
    }

    // ─── Tampilan Default (Fallback) ──────────────────────────────────────────
    
    // Email Phishing
    if (uiType === 'email') {
        return (
            <div className="absolute inset-0 bg-white flex flex-col text-left font-sans">
                <div className="bg-[#0078d4] text-white p-2.5 px-4 font-semibold text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Webmail Akebono — Outlook
                </div>
                <div className="border-b p-4 bg-[#f3f2f1] flex flex-col gap-1">
                    <div className="text-gray-900 text-xl font-semibold mb-2">MENDESAK: Kata Sandi Anda Hampir Kedaluwarsa!</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="font-semibold text-gray-800">Dukungan-TI Akebono</span> &lt;it-admin@akeb0no-secure.net&gt;
                    </div>
                    <div className="text-sm text-gray-500">Kepada: Pengguna Karyawan</div>
                </div>
                <div className="p-6 text-gray-800 text-sm flex-1 bg-white overflow-hidden relative">
                    <p className="mb-4">Yth. Karyawan,</p>
                    <p className="mb-4">Kata sandi jaringan perusahaan Anda akan <strong>kedaluwarsa dalam 2 jam</strong>. Jika tidak segera diperbarui, akun Anda akan dikunci secara otomatis dan memerlukan pembukaan kunci oleh tim TI.</p>
                    <p className="mb-6">Harap klik tautan di bawah ini untuk memperbarui kredensial Anda sekarang:</p>
                    <div className="bg-blue-50 border border-blue-200 inline-block p-4 rounded mb-6">
                        <a href="#" onClick={e => e.preventDefault()} className="underline text-[#0078d4] font-semibold text-base block">
                            https://auth.akebono-secure-reset.com/login
                        </a>
                    </div>
                    <p>Terima kasih,<br /><strong>Tim Keamanan TI Akebono</strong></p>
                    <div className="absolute inset-0 pointer-events-none">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    // Browser Phishing
    if (uiType === 'browser') {
        return (
            <div className="absolute inset-0 bg-white flex flex-col text-left font-sans">
                <div className="bg-gray-100 border-b p-2 flex items-center gap-2 px-4">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                        <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 bg-white border rounded px-3 py-1 text-xs text-gray-400 flex items-center gap-2">
                        <Monitor className="w-3 h-3" /> https://sso.akebono-portal-login.com/auth
                    </div>
                </div>
                <div className="flex-1 bg-[#f0f2f5] flex items-center justify-center p-8 relative">
                    <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
                        <div className="w-12 h-12 bg-red-600 rounded-lg mb-6 flex items-center justify-center text-white font-bold text-2xl">A</div>
                        <h2 className="text-xl font-bold mb-6">Masuk ke Portal Karyawan</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">NPK / ID Karyawan</label>
                                <div className="h-10 bg-gray-100 rounded border w-full" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Kata Sandi</label>
                                <div className="h-10 bg-gray-100 rounded border w-full" />
                            </div>
                            <div className="h-11 bg-red-600 rounded-lg w-full flex items-center justify-center text-white font-bold">Masuk</div>
                        </div>
                        <div className="mt-6 pt-6 border-t text-center">
                            <span className="text-blue-600 text-sm font-semibold">Lupa kata sandi?</span>
                        </div>
                    </div>
                    <div className="absolute inset-0 pointer-events-none">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    // Default Fallback
    return (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center relative">
            <div className="text-center p-8 opacity-20">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
                <p className="font-bold">UI Background: {uiType}</p>
            </div>
            <div className="absolute inset-0 pointer-events-none">
                {children}
            </div>
        </div>
    );
}
