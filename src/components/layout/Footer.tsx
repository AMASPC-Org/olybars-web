import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="w-full bg-black border-t border-primary/10 p-4 text-center mt-auto relative z-10">
            <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-black text-white tracking-widest font-league uppercase italic">
                    OLYBARS<span className="text-primary">.COM</span>
                </span>
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">
                    Drops have no cash value. 21+.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-2 gap-y-4 my-4">
                <Link to="/about" className="p-3 text-[10px] text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-wider">About</Link>
                <Link to="/terms" className="p-3 text-[10px] text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-wider">Terms</Link>
                <Link to="/privacy" className="p-3 text-[10px] text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-wider">Privacy</Link>
                <Link to="/cookies" className="p-3 text-[10px] text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-wider">Cookies</Link>
                <Link to="/security" className="p-3 text-[10px] text-slate-500 hover:text-primary transition-colors font-bold uppercase tracking-wider">Security</Link>
            </div>

            <p className="type-label text-[7px] text-slate-600">
                © 2026 OlyBars | Part of the AMA Network
            </p>
        </footer>
    );
};
