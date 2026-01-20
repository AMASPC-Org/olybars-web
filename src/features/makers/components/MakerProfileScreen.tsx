import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Maker } from '../../../types/sponsorship';
import { UserProfile } from '../../../types';
import { MakerSponsorships } from './MakerSponsorships';


interface MakerProfileScreenProps {
    userProfile: UserProfile;
}

export const MakerProfileScreen: React.FC<MakerProfileScreenProps> = ({ userProfile }) => {
    const [maker, setMaker] = useState<Maker | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Maker>>({});

    useEffect(() => {
        if (!userProfile || userProfile.uid === 'guest') {
            setLoading(false);
            return;
        }

        const fetchMaker = async () => {
            // Find maker profile owned by this user
            const q = query(collection(db, 'makers'), where('ownerId', '==', userProfile.uid));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const data = snapshot.docs[0].data() as Maker;
                setMaker(data);
                setFormData(data);
                setIsEditing(false);
            } else {
                // Pre-fill defaults for new maker
                setIsEditing(true);
                setFormData({
                    name: userProfile.displayName || '',
                    type: 'other',
                });
            }
            setLoading(false);
        };
        fetchMaker();
    }, [userProfile]);

    const handleSave = async () => {
        if (!userProfile.uid) return;

        // If editing existing, use ID. If new, generate ID.
        const makerId = maker?.id || `maker-${Date.now()}`;

        const newMakerData: Maker = {
            id: makerId,
            ownerId: userProfile.uid,
            name: formData.name || 'Unnamed Maker',
            type: formData.type || 'other',
            logoUrl: formData.logoUrl,
            website: formData.website,
            bio: formData.bio,
            socials: formData.socials,
            activeSponsorships: maker?.activeSponsorships || []
        };

        try {
            await setDoc(doc(db, 'makers', makerId), newMakerData, { merge: true });
            setMaker(newMakerData);
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving maker profile:", error);
            alert("Failed to save profile.");
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading Maker Profile...</div>;

    if (userProfile.uid === 'guest') {
        return (
            <div className="min-h-screen bg-neutral-900 text-white pb-20 p-8 text-center flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold mb-4">Login Required</h2>
                <p className="text-neutral-400">Please login to access the Maker Portal.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-white pb-20">
            <div className="max-w-md mx-auto p-4 space-y-6">

                <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-amber-500">Brand Profile</h2>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-sm text-amber-500 hover:underline"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Brand Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Industry Type</label>
                                <select
                                    value={formData.type || 'other'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                >
                                    <option value="brewery">Brewery</option>
                                    <option value="distillery">Distillery</option>
                                    <option value="winery">Winery</option>
                                    <option value="cidery">Cidery</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Logo URL</label>
                                <input
                                    type="text"
                                    value={formData.logoUrl || ''}
                                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Website</label>
                                <input
                                    type="text"
                                    value={formData.website || ''}
                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-400 mb-1">Bio</label>
                                <textarea
                                    value={formData.bio || ''}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none h-24"
                                />
                            </div>


                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleSave()}
                                    className="flex-1 bg-amber-500 text-black font-bold py-3 rounded-xl hover:bg-amber-400 transition-colors"
                                >
                                    Save Profile
                                </button>
                                {maker && (
                                    <button
                                        onClick={() => {
                                            setFormData(maker);
                                            setIsEditing(false);
                                        }}
                                        className="px-4 py-3 bg-neutral-700 text-white font-medium rounded-xl hover:bg-neutral-600"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            {maker?.logoUrl ? (
                                <img src={maker.logoUrl} alt={maker.name} className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-amber-500/20" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-neutral-700 mx-auto flex items-center justify-center border-2 border-neutral-600">
                                    <span className="text-3xl">🏭</span>
                                </div>
                            )}

                            <div>
                                <h3 className="text-2xl font-bold text-white">{maker?.name}</h3>
                                <p className="text-amber-500/80 text-sm uppercase tracking-wider font-bold">{maker?.type}</p>
                            </div>

                            {maker?.bio && <p className="text-neutral-400">{maker.bio}</p>}

                            <div className="flex justify-center gap-4 text-sm">
                                {maker?.website && (
                                    <a href={maker.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Website</a>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sponsorships List */}
                {maker && !isEditing && (
                    <MakerSponsorships maker={maker as Maker} />
                )}
            </div>
        </div>
    );
};
