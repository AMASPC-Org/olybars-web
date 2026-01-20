import specs from './social_media_specs.json';

export type Platform = 'facebook' | 'instagram';
export type FacebookAssetType = keyof typeof specs.social_media_specs.facebook;
export type InstagramAssetType = keyof typeof specs.social_media_specs.instagram;

/**
 * Returns the width and height for a given social media platform and asset type.
 * @param platform 'facebook' | 'instagram'
 * @param type The specific asset type (e.g., 'cover_photo_event', 'post_square')
 */
export function getSocialDimensions(platform: Platform, type: string): { width: number; height: number; aspect_ratio: string } | null {
    const platformSpecs = (specs.social_media_specs as any)[platform];
    if (!platformSpecs) return null;

    const typeSpecs = platformSpecs[type];
    if (!typeSpecs) return null;

    return {
        width: typeSpecs.width,
        height: typeSpecs.height,
        aspect_ratio: typeSpecs.aspect_ratio
    };
}
