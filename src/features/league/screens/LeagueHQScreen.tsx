import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, ShieldCheck, Ticket, ChevronRight, Info, Crown, Star, Gift, Zap, ArrowRight } from 'lucide-react';
import { fetchSystemStats } from '../../../services/userService';
import { useUser } from '../../../contexts/UserContext';
import { useLayout } from '../../../contexts/LayoutContext';

export const LeagueHQScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useUser();
  const { openModal } = useLayout();
  const [totalMembers, setTotalMembers] = useState(0);

  const isLeagueMember = userProfile && userProfile.uid !== 'guest';

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await fetchSystemStats();
        if (stats?.totalUsers) {
          setTotalMembers(stats.totalUsers);
        }
      } catch (e) {
        console.error("Failed to load league stats", e);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="bg-background text-white min-h-screen flex flex-col font-sans relative">
      {/* Header */}
      <div className="pt-6 pb-4 px-4 flex items-center gap-3 relative z-10">
        <button className="text-primary hover:text-white transition-colors" onClick={() => openModal('MAKER_MODAL')}>
          <Info size={24} />
        </button>
        <h1 className="text-primary font-league font-black text-3xl uppercase tracking-tighter shadow-gold">
          ARTESIAN BAR LEAGUE
        </h1>
      </div>

      {/* Main Content Actions */}
      <div className="flex-1 px-4 flex flex-col gap-8 relative z-10 pt-10 pb-12">
        <div className="flex gap-3 h-48 w-full max-w-md mx-auto shrink-0">
          {/* Find Events Card - 60% */}
          <button
            onClick={() => navigate('/events?type=all')}
            className="flex-[6] bg-primary rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(251,191,36,0.3)]"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80')] opacity-20 bg-cover bg-center mix-blend-overlay group-hover:opacity-30 transition-opacity" />
            <div className="absolute bottom-4 left-4 z-10 text-left">
              <div className="bg-black text-primary p-2 rounded-xl inline-block mb-2">
                <Ticket size={24} />
              </div>
              <h2 className="font-league font-black text-3xl text-black leading-none uppercase">
                Schedule<br />& Events
              </h2>
            </div>
          </button>

          {/* Leaderboard Card - 40% */}
          <button
            onClick={() => navigate('/standings')}
            className="flex-[4] bg-slate-900 border border-slate-700 rounded-3xl p-6 relative overflow-hidden group hover:border-primary/50 transition-all hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-50" />
            <div className="absolute top-4 right-4 text-slate-600 group-hover:text-primary transition-colors">
              <Trophy size={24} />
            </div>
            <div className="absolute bottom-4 left-4 z-10 text-left">
              <h2 className="font-league font-black text-2xl text-white leading-none uppercase">
                Leader<br />board
              </h2>
            </div>
          </button>
        </div>

        {/* Restore Numbered How-To-Play List */}
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="relative">
            <div className="absolute left-6 top-1 bottom-1 w-[2px] bg-white/5" />
            <div className="space-y-10 relative">
              {[
                { t: '1. Create Handle', d: 'Pick a name that will go down in Oly history.', icon: Users },
                { t: '2. Clock In', d: 'Check-in at any venue (max 2 per 12hrs).', icon: ShieldCheck },
                { t: '3. Climb the Ranks', d: 'Earn points for vibing, playing, and existing.', icon: Trophy },
                { t: '4. Win Swag', d: 'Score limited-edition gear and exclusive prizes.', icon: Gift }
              ].map((i, idx) => (
                <div key={i.t} className="flex gap-6 items-start">
                  <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl xl relative z-10 shadow-2xl">
                    <i.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="pt-0.5">
                    <h3 className="text-white font-league font-black text-xl uppercase leading-none mb-1.5">{i.t}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wide leading-tight">{i.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* restored Live Promotions Properly */}
          <div className="bg-surface/50 border border-white/5 p-6 rounded-3xl space-y-4">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={14} fill="currentColor" /> Live Promotions
            </h4>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
              <p className="text-sm font-black text-white uppercase italic mb-1">Double Points at Hannah's</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-tight">Valid during League Nights. Clock in to activate.</p>
            </div>
          </div>

          {/* Restored Join CTA for Guests */}
          {!isLeagueMember && (
            <div className="bg-primary border-4 border-black p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 relative z-20 my-8">
              <h3 className="text-black font-league font-black text-2xl uppercase leading-none mb-2">Not a Member Yet?</h3>
              <p className="text-black text-xs font-bold uppercase mb-6 leading-tight">Join {totalMembers > 0 ? totalMembers : 'locals'} competing for glory and free gear.</p>
              <button
                onClick={() => openModal('LOGIN')}
                className="w-full bg-black text-white font-league font-black py-4 rounded-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
              >
                JOIN THE LEAGUE <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Anchor: User Identity / Passport */}
      <div className="p-4 relative z-20 mt-auto bg-gradient-to-t from-black via-black/90 to-transparent pt-12">
        <div
          onClick={() => navigate('/passport')}
          className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 flex items-center justify-between shadow-2xl hover:bg-slate-800 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-600 group-hover:border-primary transition-colors">
              <Users size={20} className="text-slate-400 group-hover:text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Member ID</p>
              <h3 className="text-white font-league font-black text-xl uppercase tracking-wide group-hover:text-primary transition-colors">
                {isLeagueMember ? "My Passport" : "Guest Access"}
              </h3>
            </div>
          </div>
          <div className="bg-black/50 p-2 rounded-xl text-slate-400 group-hover:text-white transition-colors">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>

    </div>
  );
};
