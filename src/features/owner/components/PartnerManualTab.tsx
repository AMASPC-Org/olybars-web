import React from 'react';
import { Book, Zap, Layout, Clock, Calendar, Users, Globe, ExternalLink, Smartphone, ChevronRight, CheckCircle2, X, AlertTriangle, HelpCircle } from 'lucide-react';
import { ARTIE_SKILLS } from '../../../config/artieSkills';

export const PartnerManualTab: React.FC = () => {
    const [showSkills, setShowSkills] = React.useState(false);

    const sections = [
        {
            title: "Hours of Operation",
            icon: Clock,
            artie: "Ask Coach: \"Coach, update our hours for tonight to close at 2 AM.\"",
            manual: "Manual: Go to the 'Listing' tab and update the 'Hours of Operation' field."
        },
        {
            title: "Happy Hour Scheduling",
            icon: Zap,
            artie: "Ask Coach: \"Coach, schedule a Happy Hour for Monday, 3-6 PM, $1 off drafts.\"",
            manual: "Manual: Go to the 'Listing' tab and scroll to the 'Recurring Happy Hour' manager at the bottom."
        },
        {
            title: "Adding Events",
            icon: Calendar,
            artie: "Ask Coach: \"Coach, add Karaoke every Thursday at 9 PM starting next week.\"",
            manual: "Manual: Use the 'Events' tab to create, edit, or remove calendar listings."
        },
        {
            title: "Flash Bounties",
            icon: Zap,
            artie: "Ask Coach: \"Coach, run a $5 Burger Flash Bounty for the next 90 minutes.\"",
            manual: "Manual: Use the 'Operations' tab to instantly broadcast or schedule a Flash Bounty."
        },
        {
            title: "Listing & Profile Updates",
            icon: Layout,
            artie: "Ask Coach: \"Coach, update our website link and Instagram handle.\"",
            manual: "Manual: Use the 'Listing' tab for website, social links, and venue descriptions."
        },
        {
            "title": "Occupancy & Capacity",
            "icon": Users,
            "artie": "Ask Coach: \"Coach, set our maximum occupancy to 75.\"",
            "manual": "Manual: Go to the 'Listing' tab and update the 'Venue Capacity' field."
        },
        {
            "title": "Status Integrity (Crowdsourced)",
            "icon": AlertTriangle,
            "artie": "Ask Coach: \"Coach, tell everyone we are PACKED!\"",
            "manual": "NEW: 'Packed' status alerts are now Crowdsourced. While you can mark your status as 'Packed' in the dashboard, the official Pulse Alert (SMS to followers) only triggers when 3 unique users check in or 2 users report 'Packed' via Vibe Check within 15 minutes. Your dashboard control acts as your 'suggested' status."
        },
        {
            title: "Instagram & Content Sync",
            icon: Globe,
            artie: "Ask Coach: \"Coach, sync my latest Instagram posts.\"",
            manual: "Manual: In the 'Listing' tab, click 'Connect Instagram Business' to link your account. Once connected, Coach will automatically scan your feed for events and drafts them for your approval."
        },
        {
            title: "Marketing & Distribution Suite",
            icon: Smartphone,
            artie: "Ask Coach: \"Coach, draft a newsletter email about our new mural and Saturday trivia session.\"",
            manual: "NEW: Coach is now a Multimodal Co-Pilot. Use the chat to draft Social Posts, Emails, Community Calendar entries, and Website updates. You can even generate AI image prompts for your social assets. All drafts are saved to your dashboard for final review."
        },
        {
            title: "Conversion Tools (Double Dip)",
            icon: Smartphone,
            artie: "Ask Coach: \"Coach, set our loyalty signup link to 'toasttab.com/ourvenue' and our hero item to the 'Artesian Burger'.\"",
            manual: "NEW: Drive direct ROI by setting your 'Loyalty Signup URL' and 'Hero Item' in the Listing tab. These trigger a 'Double Dip' CTA for users after they Clock In, stacking OlyBars points with your own venue rewards or nudging them toward your highest-margin food items."
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-xl border border-primary/30">
                    <Book className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter font-league leading-none">THE PARTNER MANUAL</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                            Master your presence on OlyBars. Choose your path: <span className="text-primary italic">The Coach Way</span> or <span className="text-white italic">The Manual Way</span>.
                        </p>
                        <button
                            onClick={() => window.open('/faq', '_blank')}
                            className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg group/faq hover:bg-primary/20 transition-all shrink-0"
                        >
                            <HelpCircle className="w-3 h-3 text-primary" />
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Player FAQ</span>
                            <ExternalLink className="w-2.5 h-2.5 text-primary/50 group-hover/faq:translate-x-0.5 group-hover/faq:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section, idx) => (
                    <div key={idx} className="bg-surface border border-white/10 rounded-2xl overflow-hidden hover:border-primary/20 transition-all group">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-primary/10 transition-colors">
                                    <section.icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase font-league tracking-tight">{section.title}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl relative group/artie">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest font-league italic">The Coach Way</span>
                                    </div>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
                                        {section.artie}
                                    </p>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover/artie:opacity-100 transition-opacity">
                                        <Zap className="w-4 h-4 text-primary opacity-30" />
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-league">The Manual Way</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                        {section.manual}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gradient-to-br from-[#0f172a] to-black border border-white/10 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-primary p-4 rounded-2xl rotate-3 shadow-2xl shadow-primary/20">
                        <Smartphone className="w-12 h-12 text-black" strokeWidth={2.5} />
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <h3 className="text-2xl font-black text-white uppercase font-league tracking-tighter mb-2 italic">Pro-Tip: Hands-Free Ops</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xl">
                            Busy at the bar? You don't need to open the Brew House to update your vibe or deals.
                            Just open the <span className="text-primary font-bold">Coach Voice Interface</span> on your phone and speak your command.
                            Our AI will draft the update and all you have to do is tap "Confirm" when you see the notification.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowSkills(true)}
                        className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        View Skills List
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Skills Modal */}
            {showSkills && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowSkills(false)}
                    />
                    <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 fade-in duration-300 flex flex-col">
                        <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest font-league italic">Authorized Skill Matrix</span>
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase font-league tracking-tighter leading-none">COACH COMMAND REPERTOIRE</h3>
                            </div>
                            <button
                                onClick={() => setShowSkills(false)}
                                className="bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white p-3 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-8 space-y-12">
                            {['PROMOTION', 'PROFILE', 'CONTENT_ENGINE', 'IDEATION'].map(category => (
                                <section key={category}>
                                    <h4 className="text-primary font-black uppercase text-xs tracking-[0.2em] mb-6 flex items-center gap-4">
                                        {category.replace('_', ' ')}
                                        <div className="h-px flex-1 bg-primary/20" />
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.values(ARTIE_SKILLS)
                                            .filter(skill => skill.category === category)
                                            .map(skill => (
                                                <div key={skill.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl hover:border-primary/30 transition-all group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h5 className="text-white font-black uppercase font-league tracking-tight group-hover:text-primary transition-colors">{skill.name}</h5>
                                                        <span className="text-[9px] font-bold text-slate-500 bg-black/40 px-2 py-1 rounded-md uppercase tracking-wider">ID: {skill.id}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                                                        {skill.description}
                                                    </p>
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">Required Intel:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {skill.params.filter(p => p.required).map(p => (
                                                                <div key={p.name} className="flex items-center gap-1.5 bg-slate-800/50 border border-white/5 px-2 py-1 rounded-lg">
                                                                    <CheckCircle2 className="w-2.5 h-2.5 text-primary/50" />
                                                                    <span className="text-[10px] text-slate-300 font-bold lowercase">{p.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        <footer className="p-6 bg-black/40 border-t border-white/5 text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                Protocol v2.0 • Real-Time Action Verification Enabled
                            </p>
                        </footer>
                    </div>
                </div>
            )}

            <footer className="text-center py-8">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    Manual Protocol v1.2.0 • Partnership Integrity Verified
                </p>
            </footer>
        </div>
    );
};
