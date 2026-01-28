import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';
import { Venue } from '../../types/venue';
import { useDiscovery } from '../../features/venues/contexts/DiscoveryContext';
import { getEffectiveRules, timeToMinutes } from '../../utils/venueUtils';

interface BuzzClockProps {
    venues: Venue[];
}

export const BuzzClock: React.FC<BuzzClockProps> = ({ venues }) => {
    const navigate = useNavigate();
    const { setFilterKind } = useDiscovery();
    const now = new Date();
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const formatMinutes = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    // 1. Get Live Items (Happy Hour Slots + Flash Bounties)
    const liveItems = venues
        .flatMap(v => {
            const items = [];

            // Add active Flash Bounty if exists
            if (v.activeFlashBounty?.isActive && (v.activeFlashBounty.endTime || 0) > Date.now()) {
                items.push({
                    id: v.id,
                    name: v.name,
                    isHQ: v.isHQ,
                    timeLabel: formatMinutes(Math.ceil((v.activeFlashBounty.endTime - Date.now()) / 60000)),
                    subLabel: 'BOUNTY',
                    deal: v.activeFlashBounty.title,
                    isLive: true,
                    isBounty: true,
                    urgency: 'red',
                    clockIns: v.clockIns,
                    status: v.status || 'gushing', // Bounties imply buzz
                    lastUpdated: v.currentBuzz?.lastUpdated
                });
            }

            const rules = getEffectiveRules(v);
            const activeRule = rules.find(r => {
                if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
                const start = timeToMinutes(r.startTime);
                const end = timeToMinutes(r.endTime);
                return currentMinutes >= start && currentMinutes < end;
            });

            if (activeRule) {
                // If it's a bounty already, maybe we don't duplicate or we do both?
                // Let's allow both but bounty wins priority in sort
                items.push({
                    id: v.id,
                    name: v.name,
                    isHQ: v.isHQ,
                    timeLabel: formatMinutes(timeToMinutes(activeRule.endTime) - currentMinutes),
                    subLabel: 'LEFT',
                    deal: activeRule.specials || activeRule.description,
                    isLive: true,
                    isBounty: false,
                    urgency: (timeToMinutes(activeRule.endTime) - currentMinutes) < 60 ? 'red' : 'green',
                    clockIns: v.clockIns,
                    status: v.status,
                    lastUpdated: v.currentBuzz?.lastUpdated
                });
            }

            // 3. Static Deal Tag (Matches BuzzScreen Logic)
            if (v.deal && !['none', 'draft', 'false', '', 'trickle', 'flowing', 'gushing', 'flooded'].includes(v.deal.toLowerCase())) {
                items.push({
                    id: v.id,
                    name: v.name,
                    isHQ: v.isHQ,
                    timeLabel: 'DEAL',
                    subLabel: 'ACTIVE',
                    deal: v.deal,
                    isLive: true,
                    isBounty: false,
                    urgency: 'amber',
                    clockIns: v.clockIns,
                    status: v.status,
                    lastUpdated: v.currentBuzz?.lastUpdated
                });
            }

            return items;
        })
        .sort((a, b) => {
            // Priority 1: Bounties first
            if (a.isBounty && !b.isBounty) return -1;
            if (!a.isBounty && b.isBounty) return 1;

            // Priority 2: Urgency (Time Left)
            // Handle 'DEAL' time label (treat as infinite/lowest urgency)
            if (a.timeLabel === 'DEAL' && b.timeLabel !== 'DEAL') return 1;
            if (a.timeLabel !== 'DEAL' && b.timeLabel === 'DEAL') return -1;
            if (a.timeLabel === 'DEAL' && b.timeLabel === 'DEAL') return 0;

            const timeA = a.timeLabel.includes('h') ? parseInt(a.timeLabel) * 60 + (parseInt(a.timeLabel.split(' ')[1]) || 0) : parseInt(a.timeLabel);
            const timeB = b.timeLabel.includes('h') ? parseInt(b.timeLabel) * 60 + (parseInt(b.timeLabel.split(' ')[1]) || 0) : parseInt(b.timeLabel);
            return timeA - timeB;
        });

    // 2. Get Upcoming Happy Hours & Bounties
    const allUpcomingItems = venues
        .flatMap(v => {
            const alreadyLive = liveItems.some(l => l.id === v.id);
            if (alreadyLive) return [];

            // A. Upcoming Flash Bounty
            const upcomingBounty = v.flashBounties?.find(b => (b as any).active && b.startTime > Date.now());
            if (upcomingBounty) {
                return [{
                    id: v.id,
                    name: v.name,
                    isHQ: v.isHQ,
                    timeLabel: formatMinutes(Math.ceil((upcomingBounty.startTime - Date.now()) / 60000)),
                    subLabel: 'STARTS',
                    deal: upcomingBounty.title,
                    isLive: false,
                    isBounty: true,
                    urgency: 'blue',
                    clockIns: v.clockIns,
                    status: v.status || 'gushing',
                    lastUpdated: v.currentBuzz?.lastUpdated
                }];
            }

            // B. Upcoming Happy Hours
            const rules = getEffectiveRules(v);
            const upcomingRules = rules
                .filter(r => {
                    if (r.days && r.days.length > 0 && !r.days.includes(currentDay)) return false;
                    const start = timeToMinutes(r.startTime);
                    return start > currentMinutes;
                })
                .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

            if (upcomingRules.length > 0) {
                const rule = upcomingRules[0];
                return [{
                    id: v.id,
                    name: v.name,
                    isHQ: v.isHQ,
                    timeLabel: formatMinutes(timeToMinutes(rule.startTime) - currentMinutes),
                    subLabel: 'STARTS',
                    deal: rule.specials || rule.description,
                    isLive: false,
                    isBounty: false,
                    urgency: 'blue',
                    clockIns: v.clockIns,
                    status: v.status,
                    lastUpdated: v.currentBuzz?.lastUpdated
                }];
            }
            return [];
        })
        .sort((a, b) => {
            const timeA = a.timeLabel.includes('h') ? parseInt(a.timeLabel) * 60 + (parseInt(a.timeLabel.split(' ')[1]) || 0) : parseInt(a.timeLabel);
            const timeB = b.timeLabel.includes('h') ? parseInt(b.timeLabel) * 60 + (parseInt(b.timeLabel.split(' ')[1]) || 0) : parseInt(b.timeLabel);
            return timeA - timeB;
        });

    // Combine and Deduplicate
    const allItems = [...liveItems, ...allUpcomingItems];
    const uniqueItemsMap = new Map();
    allItems.forEach(item => {
        if (!uniqueItemsMap.has(item.id)) {
            uniqueItemsMap.set(item.id, item);
        }
    });
    const initialPotentialItems = Array.from(uniqueItemsMap.values());

    // 3. Backfill to at least 3 items if needed
    const totalPotentialItems = React.useMemo(() => {
        if (initialPotentialItems.length >= 3) return initialPotentialItems;

        const existingIds = new Set(initialPotentialItems.map(i => i.id));
        const backfillItems = venues
            .filter(v => !existingIds.has(v.id))
            .sort((a, b) => {
                // Priority 1: HQ status
                if (a.isHQ && !b.isHQ) return -1;
                if (!a.isHQ && b.isHQ) return 1;
                // Priority 2: Most activity/buzz score
                const buzzA = a.currentBuzz?.score || 0;
                const buzzB = b.currentBuzz?.score || 0;
                return buzzB - buzzA;
            })
            .slice(0, 3 - initialPotentialItems.length)
            .map(v => ({
                id: v.id,
                name: v.name,
                isHQ: v.isHQ,
                timeLabel: 'LIVE',
                subLabel: 'VIBE',
                deal: v.vibe || v.insiderVibe,
                isLive: true,
                isBounty: false,
                urgency: 'sky',
                clockIns: v.clockIns,
                status: v.status,
                lastUpdated: v.currentBuzz?.lastUpdated
            }));

        const combined = [...initialPotentialItems, ...backfillItems];

        // 4. Hard Force 3 Items (Static Placeholders)
        const placeholders = [
            { name: "OlyBars HQ", deal: "System Online", sub: "ACTIVE" },
            { name: "Quiet City", deal: "Check back later", sub: "ZZZ" },
            { name: "Schmidt's", deal: "AI Optimized", sub: "BETA" }
        ];

        while (combined.length < 3) {
            const idx = combined.length;
            const p = placeholders[idx % placeholders.length];
            combined.push({
                id: `static-${idx}`,
                name: p.name,
                isHQ: idx === 0, // First fallback is HQ
                timeLabel: 'SOON',
                subLabel: p.sub,
                deal: p.deal,
                isLive: true,
                isBounty: false,
                urgency: 'blue',
                clockIns: 0,
                status: 'trickle',
                lastUpdated: Date.now()
            });
        }

        return combined;
    }, [initialPotentialItems, venues]);

    // Implement Rotation: 5-minute shift ensures global fairness
    const displayItems = React.useMemo(() => {
        if (totalPotentialItems.length <= 3) return totalPotentialItems;

        // Calculate offset based on 5-minute intervals since epoch
        const rotationInterval = 5 * 60 * 1000;
        const offset = Math.floor(Date.now() / rotationInterval) % totalPotentialItems.length;

        const items = [];
        for (let i = 0; i < 3; i++) {
            items.push(totalPotentialItems[(offset + i) % totalPotentialItems.length]);
        }
        return items;
    }, [totalPotentialItems]);

    const remainingCount = Math.max(0, totalPotentialItems.length - 3);

    // Helper to format status text strictly
    const getStatusDisplay = (status?: string) => {
        if (!status) return null;
        const s = status.toLowerCase();

        if (s === 'trickle') return { text: 'TRICKLE', color: 'text-slate-400', bg: 'bg-slate-500' };
        if (s === 'flowing') return { text: 'FLOWING', color: 'text-blue-400', bg: 'bg-blue-500' };
        if (s === 'gushing') return { text: 'GUSHING', color: 'text-[#FFD700]', bg: 'bg-[#FFD700]' };
        if (s === 'flooded') return { text: 'FLOODED', color: 'text-rose-400', bg: 'bg-rose-500' };
        return null;
    };

    // Helper to calculate decayed clock-ins (50% decay per hour)
    const calculateEffectiveClockIns = (rawClockIns: number = 0, lastUpdated: number = Date.now()) => {
        const hoursDiff = (Date.now() - lastUpdated) / (1000 * 60 * 60);
        const decayFactor = Math.pow(0.5, hoursDiff);
        return Math.max(1, Math.round(rawClockIns * decayFactor));
    };

    return (
        <div className="bg-black/95 backdrop-blur-md border-b border-[#FFD700]/50 shadow-2xl overflow-hidden">
            {/* Header Row - Extra Compact */}
            <div className="px-4 py-2 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#FFD700]" strokeWidth={3} />
                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] font-league">
                        The Buzz Clock
                    </h2>
                </div>
                {liveItems.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest italic">Live Now</span>
                    </div>
                )}
            </div>

            {/* High-Density List */}
            <div className="divide-y divide-white/5">
                {displayItems.length > 0 ? displayItems.map((item) => {
                    const statusConfig = getStatusDisplay(item.status);
                    const timeValue = item.timeLabel.split(' ');
                    const effectiveClockIns = calculateEffectiveClockIns(item.clockIns, item.lastUpdated || Date.now());

                    return (
                        <div
                            key={item.id}
                            onClick={() => navigate(`/bars/${item.id}`)}
                            className="px-4 py-2.5 flex justify-between items-center hover:bg-white/5 active:bg-white/10 transition-all cursor-pointer group"
                        >
                            {/* Left: Two-Line Vibe + Deal */}
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight truncate group-hover:text-[#FFD700] transition-colors font-league leading-none mb-1">
                                        {item.name}
                                    </h3>
                                    {item.isHQ && (
                                        <span className="text-[8px] bg-primary text-black font-black px-1 rounded-[2px] transform -skew-x-12">HQ</span>
                                    )}
                                </div>
                                {item.deal && (
                                    <p className="text-[10px] text-primary font-bold italic truncate mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                        {item.deal}
                                    </p>
                                )}
                                <div className="flex items-center gap-2">
                                    {statusConfig && (
                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${statusConfig.bg} bg-opacity-20 ${statusConfig.color} border border-white/5 uppercase tracking-wider`}>
                                            {statusConfig.text}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                        <Users className="w-3 h-3" /> {effectiveClockIns}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Urgent Time */}
                            <div className="text-right flex-shrink-0">
                                <div className={`text-sm font-black font-mono leading-none ${item.urgency === 'red' ? 'text-red-500' :
                                    item.urgency === 'blue' ? 'text-blue-400' :
                                        item.urgency === 'amber' ? 'text-[#FFD700]' :
                                            item.urgency === 'sky' ? 'text-sky-400' :
                                                'text-emerald-400'
                                    }`}>
                                    {timeValue[0]}<span className="text-[10px] ml-0.5">{timeValue[1]}</span>
                                </div>
                                <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter block mt-0.5">
                                    {item.subLabel}
                                </span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-6 text-center">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Quiet city... check back soon</p>
                    </div>
                )}
            </div>

            {/* Footer View All - Conditional */}
            {remainingCount > 0 && (
                <button
                    onClick={() => {
                        setFilterKind('deals');
                        navigate('/');
                    }}
                    className="w-full py-2 bg-white/5 border-t border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
                >
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
                        + {remainingCount} More (View All)
                    </span>
                </button>
            )}
        </div>
    );
};
