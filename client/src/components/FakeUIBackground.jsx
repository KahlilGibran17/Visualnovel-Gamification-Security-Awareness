import React, { useEffect, useRef, useState } from 'react';
import { Mail, Monitor, BookOpen, AlertTriangle } from 'lucide-react';

export function FakeUIScaledWrapper({ uiType, uiTypesData = [], children, className = '', ...props }) {
    const containerRef = useRef(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver((entries) => {
            if (entries[0]) {
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
                className="absolute top-0 left-0 bg-[#e0e0e0] pointer-events-none select-none origin-top-left z-0" 
                style={{ width: '800px', height: '450px', transform: `scale(${scale})` }}
            >
                <FakeUIBackground uiType={uiType} uiTypesData={uiTypesData} />
            </div>
            <div className="absolute inset-0 z-10 pointer-events-none">
                {children}
            </div>
        </div>
    );
}

export function FakeUIBackground({ uiType, uiTypesData = [] }) {
    // Check if it's a dynamically managed UI Type first
    const dynamicType = uiTypesData?.find(t => t.key_name === uiType);
    if (dynamicType && dynamicType.custom_html) {
        return <div className="absolute inset-0 bg-white" dangerouslySetInnerHTML={{ __html: dynamicType.custom_html }} />
    }

    if (uiType === 'email') {
        return (
            <div className="absolute inset-0 bg-white flex flex-col text-left font-sans">
                <div className="bg-[#0078d4] text-white p-2.5 px-4 font-semibold text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Outlook Web Access
                </div>
                <div className="border-b p-4 bg-[#f3f2f1] flex flex-col gap-1">
                    <div className="text-gray-900 text-xl font-semibold mb-2">URGENT: Password Expiry Notification</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="font-semibold text-gray-800">IT-Support</span> &lt;admin@akeb0no-secure.net&gt;
                    </div>
                    <div className="text-sm text-gray-500">To: Employee User</div>
                </div>
                <div className="p-6 text-gray-800 text-sm flex-1 bg-white overflow-hidden">
                    <p className="mb-4">Dear Employee,</p>
                    <p className="mb-4">Your Akebono corporate network password is set to expire in <strong>2 hours</strong>. Failure to update it immediately will result in a complete account lockout and require IT unblocking.</p>
                    <p className="mb-6">Please securely log in and update your credentials immediately below:</p>
                    <div className="bg-blue-50 border border-blue-200 inline-block p-4 rounded mb-6">
                        <a href="#" onClick={e => e.preventDefault()} className="underline text-[#0078d4] font-semibold text-base block">https://auth.akebono-secure-reset.com/login</a>
                    </div>
                    <p className="text-gray-500 text-xs">Regards,<br />Information Technology Administration Desk<br />Akebono Brake Astra Indonesia</p>
                </div>
            </div>
        );
    }

    if (uiType === 'desktop') {
        return (
            <div className="absolute inset-0 bg-[#005a9e] flex flex-col">
                <div className="flex-1 p-4 grid grid-cols-6 gap-4 content-start">
                    <div className="w-16 flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-blue-300 rounded shadow flex items-center justify-center text-[#005a9e]"><Monitor className="w-6 h-6" /></div>
                        <span className="text-white text-xs drop-shadow-md text-center">My PC</span>
                    </div>
                    <div className="w-16 flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-yellow-400 rounded shadow flex items-center justify-center text-white"><BookOpen className="w-6 h-6" /></div>
                        <span className="text-white text-xs drop-shadow-md text-center">Reports</span>
                    </div>
                    <div className="w-16 flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-gray-200 rounded shadow border-l-[12px] border-red-500 flex items-center justify-center relative"><span className="absolute bottom-0 right-0 text-[10px] font-bold text-gray-500 bg-white px-0.5 border">EXE</span></div>
                        <span className="text-white text-xs drop-shadow-md text-center bg-blue-600/50 px-1 rounded truncate w-20">Salary_2024.pdf.exe</span>
                    </div>
                </div>
                <div className="h-10 bg-black/80 backdrop-blur border-t border-white/10 flex items-center px-2 z-10 w-full shrink-0">
                    <div className="w-10 h-8 rounded bg-[#0078d4] mr-4 flex items-center justify-center text-white font-bold text-xs shadow-inner">Start</div>
                    <div className="text-white text-xs ml-auto pr-4">12:00 PM</div>
                </div>
            </div>
        );
    }

    // Default to browser
    return (
        <div className="absolute inset-0 bg-gray-100 flex flex-col">
            <div className="h-10 bg-[#dee1e6] border-b border-[#cccccc] flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-[#ff5f56]" /><div className="w-3 h-3 rounded-full bg-[#ffbd2e]" /><div className="w-3 h-3 rounded-full bg-[#27c93f]" /></div>
                <div className="ml-4 flex-1 bg-white rounded-full text-xs px-4 py-1.5 text-red-600 font-mono shadow-sm flex items-center gap-2 border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> <span className="truncate">https://akeb0no-internal-login.net/auth/verify?token=1829f0</span>
                </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] text-gray-800 overflow-hidden">
                <div className="bg-white p-8 rounded-xl shadow-xl w-[400px] border border-gray-100 flex flex-col items-center shrink-0">
                    <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white font-bold text-xl">AKE</span>
                    </div>
                    <h2 className="text-xl font-bold mb-6 text-center text-gray-800 w-full border-b pb-4">Employee Portal Login</h2>
                    <div className="space-y-4 w-full">
                        <div>
                            <input type="text" disabled className="w-full border border-gray-300 rounded-md mt-1 p-2.5 bg-gray-50 text-sm" placeholder="Enter NIK (e.g. 10001)" />
                        </div>
                        <div>
                            <input type="password" disabled className="w-full border border-gray-300 rounded-md mt-1 p-2.5 bg-gray-50 text-sm" placeholder="Password" />
                        </div>
                        <button className="w-full bg-[#005a9e] text-white rounded-md p-2.5 font-bold opacity-70 cursor-not-allowed mt-2">Sign In securely</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
