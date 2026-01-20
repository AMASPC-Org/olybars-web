import React, { useState, useMemo } from 'react';
import {
    Venue,
    MenuItem,
    HappyHourMenuItem,
    MenuItemType,
    MenuItemStatus,
    MarginTier,
    MenuSource
} from '../../../types/venue';
import { UserProfile } from '../../../types';
import { isSystemAdmin } from '../../../types/auth_schema';
import { VenueOpsService } from '../../../services/VenueOpsService';
import {
    Beer,
    Wine,
    Martini,
    Utensils,
    Plus,
    Search,
    AlertTriangle,
    Power,
    Library,
    Trash2,
    Zap
} from 'lucide-react';
import { useToast } from '../../../components/ui/BrandedToast';

interface MenuManagementTabProps {
    venue: Venue;
    onUpdate: (venueId: string, updates: Partial<Venue>) => void;
    userId?: string;
    userProfile: UserProfile;
}

export const MenuManagementTab: React.FC<MenuManagementTabProps> = ({ venue, onUpdate, userId, userProfile }) => {
    const { showToast } = useToast();
    const isActiveAdmin = isSystemAdmin(userProfile);
    const [activeTab, setActiveTab] = useState<'live' | 'library'>('live');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize Menu Items
    const [menuItems, setMenuItems] = useState<MenuItem[]>(venue.fullMenu || []);
    const [happyHourMenu, setHappyHourMenu] = useState<HappyHourMenuItem[]>(venue.happyHourMenu || []);
    const [isLoadingPrivate, setIsLoadingPrivate] = useState(true);

    // Fetch Private Data (Margins)
    React.useEffect(() => {
        const loadPrivate = async () => {
            try {
                const privateData = await VenueOpsService.getPrivateData(venue.id);
                if (privateData && privateData.menuStrategies) {
                    const mergedItems = (venue.fullMenu || []).map(item => ({
                        ...item,
                        margin_tier: privateData.menuStrategies[item.id] || MarginTier.Medium
                    }));
                    setMenuItems(mergedItems);
                }
            } catch (err) {
                console.error('Failed to load private data:', err);
            } finally {
                setIsLoadingPrivate(false);
            }
        };
        loadPrivate();
    }, [venue.id, venue.fullMenu]);

    // Form State for New Item
    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        type: MenuItemType.Hoppy,
        margin_tier: MarginTier.Medium,
        source: MenuSource.Manual,
        status: MenuItemStatus.Library,
        stats: {}
    });

    // --- Actions ---

    const handleToggleStatus = async (item: MenuItem) => {
        const newStatus = item.status === MenuItemStatus.Live ? MenuItemStatus.Library : MenuItemStatus.Live;
        const now = Date.now();

        const updatedItems = menuItems.map(i =>
            i.id === item.id
                ? { ...i, status: newStatus, last_toggled_at: now }
                : i
        );
        setMenuItems(updatedItems);

        try {
            await VenueOpsService.updateVenue(venue.id, { fullMenu: updatedItems }, userId);
            onUpdate(venue.id, { fullMenu: updatedItems });
            showToast(`Item moved to ${newStatus === MenuItemStatus.Live ? 'Live Taps' : 'Library'}`, 'success');
        } catch (error) {
            console.error('Failed to update status', error);
            showToast('Sync failed', 'error');
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name) return;
        setIsSubmitting(true);
        try {
            const addedItem: MenuItem = {
                id: crypto.randomUUID(),
                name: newItem.name,
                type: newItem.type || MenuItemType.Hoppy,
                description: newItem.description || '',
                source: MenuSource.Manual,
                status: MenuItemStatus.Library,
                margin_tier: newItem.margin_tier || MarginTier.Medium,
                stats: newItem.stats || {}
            };

            const updatedItems = [...menuItems, addedItem];
            setMenuItems(updatedItems);
            await VenueOpsService.updateVenue(venue.id, { fullMenu: updatedItems }, userId);
            onUpdate(venue.id, { fullMenu: updatedItems });
            showToast('Item added to library', 'success');
            setIsAddModalOpen(false);
            setNewItem({
                type: MenuItemType.Hoppy,
                margin_tier: MarginTier.Medium,
                source: MenuSource.Manual,
                status: MenuItemStatus.Library,
                stats: {}
            });
        } catch (error) {
            console.error('Failed to add item', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddHappyHourItem = () => {
        const newItem: HappyHourMenuItem = {
            id: crypto.randomUUID(),
            name: '',
            price: '',
            category: 'drink',
            description: ''
        };
        const updatedMenu = [...happyHourMenu, newItem];
        setHappyHourMenu(updatedMenu);
        onUpdate(venue.id, { happyHourMenu: updatedMenu });
        VenueOpsService.updateVenue(venue.id, { happyHourMenu: updatedMenu }, userId);
    };

    const handleUpdateHappyHourItem = (idx: number, updates: Partial<HappyHourMenuItem>) => {
        const updatedMenu = [...happyHourMenu];
        updatedMenu[idx] = { ...updatedMenu[idx], ...updates };
        setHappyHourMenu(updatedMenu);
        onUpdate(venue.id, { happyHourMenu: updatedMenu });
        VenueOpsService.updateVenue(venue.id, { happyHourMenu: updatedMenu }, userId);
    };

    const handleRemoveHappyHourItem = (id: string) => {
        const updatedMenu = happyHourMenu.filter(item => item.id !== id);
        setHappyHourMenu(updatedMenu);
        onUpdate(venue.id, { happyHourMenu: updatedMenu });
        VenueOpsService.updateVenue(venue.id, { happyHourMenu: updatedMenu }, userId);
    };

    // --- Computed ---

    const filteredItems = useMemo(() => {
        return menuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (activeTab === 'live') return item.status === MenuItemStatus.Live && matchesSearch;
            return matchesSearch;
        });
    }, [menuItems, activeTab, searchTerm]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, MenuItem[]> = {};
        Object.values(MenuItemType).forEach(type => groups[type] = []);
        filteredItems.forEach(item => {
            if (!groups[item.type]) groups[item.type] = [];
            groups[item.type].push(item);
        });
        return groups;
    }, [filteredItems]);

    const typeOrder = [
        MenuItemType.Crisp, MenuItemType.Hoppy, MenuItemType.Malty, MenuItemType.Dark,
        MenuItemType.Sour, MenuItemType.Cider, MenuItemType.Seltzer,
        MenuItemType.Cocktail, MenuItemType.Wine, MenuItemType.Food, MenuItemType.Other
    ];

    const getTypeIcon = (type: MenuItemType) => {
        switch (type) {
            case MenuItemType.Crisp:
            case MenuItemType.Hoppy:
            case MenuItemType.Malty:
            case MenuItemType.Dark:
            case MenuItemType.Sour:
            case MenuItemType.Cider:
            case MenuItemType.Seltzer: return <Beer size={18} />;
            case MenuItemType.Cocktail: return <Martini size={18} />;
            case MenuItemType.Wine: return <Wine size={18} />;
            case MenuItemType.Food: return <Utensils size={18} />;
            default: return <Beer size={18} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter">THE MENU</h2>
                        <p className="text-sm text-slate-400">Manage your taps, bottles, and bites.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-primary text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-colors"
                    >
                        <Plus size={18} />
                        ADD ITEM
                    </button>
                </div>

                <div className="flex gap-4 items-center bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto self-start">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'live' ? 'bg-primary text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        LIVE NOW
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'library' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        FULL LIBRARY
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Happy Hour Menu
                        </h3>
                        <p className="text-xs text-slate-400">Items only visible during active HH windows.</p>
                    </div>
                    <button
                        onClick={handleAddHappyHourItem}
                        className="bg-black/40 hover:bg-black/60 border border-white/10 text-primary px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <Plus className="w-3 h-3 inline mr-1" /> Add HH Item
                    </button>
                </div>

                <div className="space-y-3">
                    {happyHourMenu.map((item, idx) => (
                        <div key={item.id} className="bg-black/20 border border-white/5 p-4 rounded-xl flex flex-col gap-3 group transition-all hover:border-white/10">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-700 italic">{idx + 1}</span>
                                <input
                                    placeholder="HH Item Name"
                                    value={item.name}
                                    onChange={(e) => handleUpdateHappyHourItem(idx, { name: e.target.value })}
                                    className="flex-grow bg-transparent border-none text-sm text-white placeholder:text-slate-800 font-bold focus:ring-0 p-0"
                                />
                                <div className="flex items-center gap-2 border-l border-white/5 pl-4">
                                    <span className="text-xs text-slate-500">$</span>
                                    <input
                                        placeholder="0.00"
                                        value={item.price}
                                        onChange={(e) => handleUpdateHappyHourItem(idx, { price: e.target.value })}
                                        className="w-16 bg-transparent border-none text-sm text-primary font-mono font-black placeholder:text-slate-800 text-right focus:ring-0 p-0"
                                    />
                                </div>
                                <div className="flex bg-slate-800 rounded-lg p-1 border border-white/5">
                                    {(['drink', 'food'] as const).map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => handleUpdateHappyHourItem(idx, { category: cat })}
                                            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${item.category === cat
                                                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleRemoveHappyHourItem(item.id)}
                                    className="p-1 text-slate-700 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <input
                                placeholder="Short description (max 60 chars)"
                                value={item.description || ''}
                                maxLength={60}
                                onChange={(e) => handleUpdateHappyHourItem(idx, { description: e.target.value })}
                                className="w-full bg-transparent border-none text-[11px] text-slate-500 placeholder:text-slate-800 italic focus:ring-0 p-0"
                            />
                        </div>
                    ))}

                    {happyHourMenu.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                            <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest italic">No happy hour specific items yet</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {typeOrder.map(type => {
                    const items = groupedItems[type];
                    if (items.length === 0) return null;

                    return (
                        <div key={type} className="bg-slate-800/40 rounded-xl overflow-hidden border border-slate-800">
                            <div className="px-4 py-3 bg-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-primary">
                                    {getTypeIcon(type as MenuItemType)}
                                    <h3 className="font-black uppercase tracking-wide">{type} <span className="text-slate-500 ml-2 text-xs font-mono">({items.length})</span></h3>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-800">
                                {items.map(item => (
                                    <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-white text-lg">{item.name}</h4>
                                                {item.stats.abv && parseFloat(item.stats.abv.toString()) > 8.0 && (
                                                    <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 border border-red-500/30">
                                                        <AlertTriangle size={10} />
                                                        {item.stats.abv}% ABV
                                                    </span>
                                                )}
                                                {item.margin_tier === MarginTier.High && (
                                                    <span className="bg-green-500/20 text-green-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-green-500/30">
                                                        $$$
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400 line-clamp-1">{item.description || 'No description'}</p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.status === MenuItemStatus.Live
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {item.status === MenuItemStatus.Live ? 'ON TAP' : 'LIBRARY'}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 flex items-center ${item.status === MenuItemStatus.Live ? 'bg-primary' : 'bg-slate-700'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${item.status === MenuItemStatus.Live ? 'translate-x-6' : 'translate-x-0'
                                                    }`}>
                                                    {item.status === MenuItemStatus.Live && <Power size={14} className="text-primary m-1" />}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredItems.length === 0 && (
                <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
                    <Library size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold mb-2">No items found</p>
                    <p className="text-sm">Try adjusting your search or add a new item.</p>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black italic text-white">ADD NEW ITEM</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">Close</button>
                            </div>

                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-1 block">NAME</label>
                                    <input
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                        placeholder="e.g. Space Dust IPA"
                                        value={newItem.name || ''}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">TYPE</label>
                                        <select
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                            value={newItem.type}
                                            onChange={e => setNewItem({ ...newItem, type: e.target.value as MenuItemType })}
                                        >
                                            {Object.values(MenuItemType).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">PRICE</label>
                                        <input
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                            placeholder="$7"
                                            value={newItem.stats?.price || ''}
                                            onChange={e => setNewItem({ ...newItem, stats: { ...newItem.stats, price: e.target.value } })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 mb-1 block">DESCRIPTION (Max 140)</label>
                                    <textarea
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                        placeholder="Flavor notes, hop varieties..."
                                        rows={2}
                                        maxLength={140}
                                        value={newItem.description || ''}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">ABV %</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                            placeholder="5.2"
                                            value={newItem.stats?.abv || ''}
                                            onChange={e => setNewItem({ ...newItem, stats: { ...newItem.stats, abv: parseFloat(e.target.value) } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 mb-1 block">IBU</label>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                                            placeholder="40"
                                            value={newItem.stats?.ibu || ''}
                                            onChange={e => setNewItem({ ...newItem, stats: { ...newItem.stats, ibu: parseFloat(e.target.value) } })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                                    <label className="text-xs font-bold text-blue-400 mb-3 block flex items-center gap-2">
                                        <Search size={12} /> OPS INTELLIGENCE
                                    </label>
                                    <div className="space-y-3">
                                        <label className="text-xs font-semibold text-slate-400">MARGIN TIER</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[MarginTier.High, MarginTier.Medium, MarginTier.Low].map(tier => (
                                                <button
                                                    key={tier}
                                                    onClick={() => setNewItem({ ...newItem, margin_tier: tier })}
                                                    className={`py-2 px-1 rounded-lg text-xs font-bold border ${newItem.margin_tier === tier
                                                        ? 'bg-blue-600 border-blue-500 text-white'
                                                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                                        }`}
                                                >
                                                    {tier === 'High' ? 'High Profit' : tier === 'Medium' ? 'Standard' : 'Low Profit'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 font-bold text-slate-400 hover:text-white"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={handleAddItem}
                                    disabled={isSubmitting || !newItem.name}
                                    className="flex-1 bg-primary text-black py-3 rounded-xl font-bold hover:bg-yellow-400 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'SAVING...' : 'ADD TO LIBRARY'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
