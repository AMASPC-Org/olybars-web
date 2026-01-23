// src/config/tiers.ts

export enum PartnerTier {
  LOCAL = "local", // Tier 1: Free
  DIY = "diy", // Tier 2: $99/mo
  PRO = "pro", // Tier 3: $399/mo
  AGENCY = "agency", // Tier 4: $799/mo
}

export interface TierFeatures {
  name: string;
  price: number;
  pointBankCap: number; // The "Ammo" (Monthly)
  flashBountyLimit: number; // Campaigns per month
  canAutoSyncIG: boolean; // We pull FROM them
  hasMediaDistribution: boolean; // We push TO the City (The Press Agent)
  supportLevel: "community" | "standard" | "priority" | "dedicated";
  canSyncExternalMedia?: boolean; // Legacy support for types
}

export const TIER_CONFIG: Record<PartnerTier, TierFeatures> = {
  [PartnerTier.LOCAL]: {
    name: "The Local",
    price: 0,
    pointBankCap: 250, // ~10 clock-ins (Enough to see it work)
    flashBountyLimit: 1, // One "Teaser" campaign
    canAutoSyncIG: false,
    hasMediaDistribution: false, // Manual entry only
    supportLevel: "community",
    canSyncExternalMedia: false,
  },
  [PartnerTier.DIY]: {
    name: "DIY Toolkit",
    price: 99,
    pointBankCap: 1500, // ~60 clock-ins
    flashBountyLimit: 4, // Weekly Campaign
    canAutoSyncIG: true,
    hasMediaDistribution: true, // UNLOCKED: We email ThurstonTalk/ODA
    supportLevel: "standard",
    canSyncExternalMedia: true,
  },
  [PartnerTier.PRO]: {
    name: "Pro League",
    price: 399,
    pointBankCap: 10000, // ~400 clock-ins
    flashBountyLimit: 12, // 3x Weekly
    canAutoSyncIG: true,
    hasMediaDistribution: true,
    supportLevel: "priority",
    canSyncExternalMedia: true,
  },
  [PartnerTier.AGENCY]: {
    name: "Agency Legend",
    price: 799,
    pointBankCap: 1000000, // Fair Use
    flashBountyLimit: 100,
    canAutoSyncIG: true,
    hasMediaDistribution: true,
    supportLevel: "dedicated",
    canSyncExternalMedia: true,
  },
};
