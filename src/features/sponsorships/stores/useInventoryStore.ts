import { create } from 'zustand';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { SponsorshipAsset } from '../../../types/sponsorship';

interface InventoryStore {
    assets: SponsorshipAsset[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchAssets: (venueId: string) => Promise<void>;
    createAsset: (venueId: string, asset: Omit<SponsorshipAsset, 'venueId'>) => Promise<void>;
    updateAsset: (venueId: string, assetId: string, updates: Partial<SponsorshipAsset>) => Promise<void>;
    deleteAsset: (venueId: string, assetId: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
    assets: [],
    isLoading: false,
    error: null,

    fetchAssets: async (venueId: string) => {
        set({ isLoading: true, error: null });
        try {
            const inventoryRef = collection(db, 'venues', venueId, 'inventory');
            const snapshot = await getDocs(inventoryRef);
            const assets = snapshot.docs.map(doc => doc.data() as SponsorshipAsset);
            set({ assets, isLoading: false });
        } catch (error) {
            console.error('Error fetching inventory:', error);
            set({ error: 'Failed to load inventory.', isLoading: false });
        }
    },

    createAsset: async (venueId: string, asset: Omit<SponsorshipAsset, 'venueId'>) => {
        set({ isLoading: true, error: null });
        try {
            const newAsset: SponsorshipAsset = {
                ...asset,
                venueId
            };
            const docRef = doc(db, 'venues', venueId, 'inventory', asset.id);
            await setDoc(docRef, newAsset);

            set(state => ({
                assets: [...state.assets, newAsset],
                isLoading: false
            }));
        } catch (error) {
            console.error('Error adding asset:', error);
            set({ error: 'Failed to add asset.', isLoading: false });
        }
    },

    updateAsset: async (venueId: string, assetId: string, updates: Partial<SponsorshipAsset>) => {
        set({ isLoading: true, error: null });
        try {
            const docRef = doc(db, 'venues', venueId, 'inventory', assetId);
            await setDoc(docRef, updates, { merge: true });

            set(state => ({
                assets: state.assets.map(a => a.id === assetId ? { ...a, ...updates } : a),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error updating asset:', error);
            set({ error: 'Failed to update asset.', isLoading: false });
        }
    },

    deleteAsset: async (venueId: string, assetId: string) => {
        set({ isLoading: true, error: null });
        try {
            const docRef = doc(db, 'venues', venueId, 'inventory', assetId);
            await deleteDoc(docRef);

            set(state => ({
                assets: state.assets.filter(a => a.id !== assetId),
                isLoading: false
            }));
        } catch (error) {
            console.error('Error deleting asset:', error);
            set({ error: 'Failed to delete asset.', isLoading: false });
        }
    }
}));
