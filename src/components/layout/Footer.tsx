import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        <footer className="w-full bg-black border-t border-primary/10 p-4 text-center mt-auto">
            <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-black text-white tracking-widest font-league uppercase italic">
                    OLYBARS<span className="text-primary">.COM</span>
                </span>
                <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">
                    Drops have no cash value. 21+.
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 my-3 type-label text-[7px] text-slate-500">
                <Link to="/about" className="hover:text-primary transition-colors">About</Link>
                <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
                <Link to="/security" className="hover:text-primary transition-colors">Security</Link>
            </div>

            <p className="type-label text-[7px] text-slate-600">
                © 2026 OlyBars | Part of the AMA Network
            </p>
        </footer>
    );
};
