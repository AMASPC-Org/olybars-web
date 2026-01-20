export type AssetType = 'digital_display' | 'physical_signage' | 'audio_shoutout' | 'social_collab' | 'booth_space' | 'other';

// 1. The Inventory Item (Stored in venues/{id}/inventory)
export interface SponsorshipAsset {
    id: string;
    venueId: string;
    name: string;
    type: AssetType;
    description: string;
    quantity: number;
    baseValuation: number;
    isActive: boolean;
    createdAt: number;
    updatedAt?: number;
    specs?: {
        dimensions?: string;
        format?: string;
        duration?: string;
    };
}

// 2. The Business Entity (Stored in makers/{id})
export interface Maker {
    id: string;
    name: string;
    logoUrl?: string;
    ownerId: string; // The User ID managing this maker
    type: 'brewery' | 'distillery' | 'winery' | 'cidery' | 'other';
    bio?: string;
    website?: string;
    socials?: {
        instagram?: string;
        facebook?: string;
    };
    activeSponsorships: string[]; // List of package IDs
}

// 3. The Deal (Embedded in events/{id})
export interface EventSponsorshipPackage {
    id: string;
    eventId?: string; // Optional during creation flow
    title: string;
    description: string; // Snapshot of the package description
    price: number;       // Snapshot of the price at time of deal
    items: {
        assetId: string;
        name: string;        // Snapshot of the asset name
        description: string; // Snapshot of the asset description
        type: AssetType;
        count: number;
        baseValuation: number; // Snapshot of valuation
        specs?: {     // Snapshot of the specs
            dimensions?: string;
            format?: string;
            duration?: string;
        };
    }[];
    status: 'available' | 'reserved' | 'pending_review' | 'sold';
    sponsorId?: string; // Ref to makers/{id}
    createdAt: number;
}
