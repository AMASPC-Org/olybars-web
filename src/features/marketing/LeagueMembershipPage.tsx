import React, { useState } from 'react';
import { Check, Shield, Star, Zap, Crown, ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';

const Tiers = [
    {
        id: 'free',
        name: 'The Free Lounge',
        price: 'Free',
        priceSuffix: 'Forever',
        vibe: 'ENTRY POINT',
        description: 'Get on the Map',
        icon: Shield,
        color: 'slate',
        features: [
            'Basic Business Name & Address',
            'Viewer-Only Access (No Drops)',
            'Upgrade Anytime'
        ],
        cta: 'CURRENT STATUS',
        ctaVariant: 'outline'
    },
    {
        id: 'diy',
        name: 'The DIY Toolkit',
        price: '$99',
        priceSuffix: '/mo',
        vibe: 'INDUSTRIAL TOOL',
        description: 'Self-Service Control',
        icon: Zap,
        color: 'bronze',
        features: [
            'Standard Verified Listing',
            'Pay-As-You-Go Drops System',
            'Access to Owner Portal',
            'Community Forum Support'
        ],
        cta: 'Equip Toolkit',
        ctaVariant: 'bronze'
    },
    {
        id: 'pro',
        name: 'Pro League',
        price: '$399',
        priceSuffix: '/mo',
        vibe: 'GUIDED EXPERIENCE',
        description: 'Enhanced Visibility Package',
        icon: Star,
        color: 'silver',
        isPopular: true,
        features: [
            '5,000 Monthly Drop Allowance',
            '"Artie\'s Picks" Feature Rotation',
            'Advanced Analytics Dashboard',
            'Standard Business Support'
        ],
        cta: 'Go Pro With Artie',
        ctaVariant: 'silver'
    },
    {
        id: 'agency',
        name: 'Agency Legend',
        price: '$799',
        priceSuffix: '/mo',
        vibe: 'LEGENDARY ITEM',
        description: 'The Artesian Premier Partnership',
        icon: Crown,
        color: 'gold',
        features: [
            'Keystone Local Status',
            'UNLIMITED Engagement Drops',
            'PRIORITY 24/7 Dedicated Support',
            'Founding Partner Ring on Listing',
            'Quarterly Strategy Review'
        ],
        cta: 'Become Legendary',
        ctaVariant: 'gold'
    }
];

export const LeagueMembershipPage = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    return (
        <div className="min-h-screen bg-[#0A1E2D] relative overflow-hidden font-sans text-cream-50 selection:bg-gold-500 selection:text-black">
            <SEO title="Venue Partner Status - OlyBars" description="Upgrade your venue's standing in the League." />

            {/* Vintage Hero Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 py-8 md:py-16">
                {/* Header */}
                <header className="text-center mb-12 md:mb-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-400 hover:text-gold-400 transition-colors uppercase font-black text-xs tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="inline-block mb-4 p-3 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                        <img
                            src="/logo_horseshoe.png"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                            alt="OlyBars"
                            className="w-8 h-8 opacity-80"
                        />
                        <Shield className="w-8 h-8 text-gold-400" />
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black text-gold-400 uppercase font-league tracking-tighter mb-6 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                        Select Partner Tier
                    </h1>
                    <p className="text-lg md:text-2xl text-slate-300 font-bold max-w-3xl mx-auto leading-tight italic opacity-90">
                        Upgrade your Venue's standing in the League. <br className="hidden md:block" />
                        Unlock premium visibility for Players and dominate the local scene.
                    </p>

                    {/* Toggle Switch */}
                    <div className="flex items-center justify-center gap-6 mt-10">
                        <span className={`text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-500'}`}>
                            Monthly
                        </span>
                        <div
                            className="w-16 h-8 bg-[#1a2c3d] rounded-full p-1 cursor-pointer border-2 border-gold-500/30 relative"
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                        >
                            <div className={`w-5 h-5 bg-gold-400 rounded-full shadow-lg transform transition-transform duration-300 ${billingCycle === 'annual' ? 'translate-x-8' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest transition-colors ${billingCycle === 'annual' ? 'text-white' : 'text-slate-500'}`}>
                            Annual <span className="text-gold-400 ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </header>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8">
                    {Tiers.map((tier) => (
                        <div
                            key={tier.id}
                            className={`relative group bg-[#0f172a] rounded-2xl border transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl flex flex-col
                                ${tier.id === 'pro' ? 'border-silver-400/50 shadow-silver-500/10' :
                                    tier.id === 'agency' ? 'border-gold-500/50 shadow-gold-500/10' :
                                        tier.id === 'diy' ? 'border-orange-700/30' : 'border-slate-800'
                                }
                            `}
                        >
                            {tier.isPopular && (
                                <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl rounded-tr-xl shadow-lg z-20 font-league tracking-widest">
                                    Most Popular
                                </div>
                            )}

                            {/* Card Header & Visual */}
                            <div className={`p-6 border-b border-white/5 relative overflow-hidden h-40 flex flex-col justify-center items-center text-center
                                ${tier.color === 'gold' ? 'bg-gradient-to-b from-yellow-900/20 to-transparent' :
                                    tier.color === 'silver' ? 'bg-gradient-to-b from-slate-700/20 to-transparent' :
                                        tier.color === 'bronze' ? 'bg-gradient-to-b from-orange-900/10 to-transparent' : ''}
                            `}>
                                <div className={`mb-3 p-3 rounded-xl bg-black/30 border border-white/10 backdrop-blur-md group-hover:scale-110 transition-transform duration-500
                                     ${tier.color === 'gold' ? 'text-yellow-400' :
                                        tier.color === 'silver' ? 'text-slate-300' :
                                            tier.color === 'bronze' ? 'text-orange-400' : 'text-slate-500'}
                                `}>
                                    <tier.icon className="w-8 h-8" />
                                </div>
                                <h3 className={`text-sm font-black uppercase tracking-widest font-league
                                     ${tier.color === 'gold' ? 'text-yellow-400' :
                                        tier.color === 'silver' ? 'text-slate-200' :
                                            tier.color === 'bronze' ? 'text-orange-400' : 'text-slate-400'}
                                `}>
                                    {tier.name}
                                </h3>
                            </div>

                            {/* Price Area */}
                            <div className="p-6 text-center space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-3xl font-black text-white font-league tracking-tight">
                                        {tier.price}
                                    </span>
                                    {billingCycle === 'annual' && tier.price !== 'Free' && (
                                        <span className="text-xs font-bold text-green-400 line-through opacity-60">
                                            {parseInt(tier.price.replace('$', '')) * 1.25}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    {tier.priceSuffix}
                                </p>
                            </div>

                            {/* Features */}
                            <div className="p-6 flex-1 bg-black/20">
                                <div className="mb-6">
                                    <h4 className="text-sm font-black text-white uppercase font-league mb-2">
                                        {tier.description}
                                    </h4>
                                    <div className="h-0.5 w-8 bg-white/10 rounded-full" />
                                </div>
                                <ul className="space-y-4">
                                    {tier.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <Check className={`w-4 h-4 shrink-0 mt-0.5 
                                                ${tier.color === 'gold' ? 'text-yellow-400' :
                                                    tier.color === 'silver' ? 'text-slate-300' : 'text-slate-600'}
                                            `} />
                                            <span className="text-xs font-medium text-slate-400 leading-snug">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* CTA */}
                            <div className="p-6 mt-auto">
                                <button className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 shadow-lg flex items-center justify-center gap-2 group-hover:scale-[1.02]
                                    ${tier.ctaVariant === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-yellow-500/20 hover:shadow-yellow-500/40' :
                                        tier.ctaVariant === 'silver' ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-black shadow-slate-400/20 hover:shadow-slate-400/40' :
                                            tier.ctaVariant === 'bronze' ? 'bg-gradient-to-r from-orange-700 to-orange-800 text-white shadow-orange-900/20' :
                                                'bg-transparent border border-white/20 text-white hover:bg-white/5'}
                                `}>
                                    {tier.cta}
                                    {tier.ctaVariant !== 'outline' && <ArrowUpRight className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center opacity-60">
                    <img
                        src="/logo_horseshoe.png"
                        onError={(e) => e.currentTarget.style.display = 'none'}
                        alt="League Official"
                        className="w-12 h-12 mx-auto grayscale opacity-50 mb-4"
                    />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                        Official Artesian Bar League Partnership
                    </p>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <p className="text-slate-400 text-sm mb-4">Don't have time to set this up?</p>
                        <button
                            onClick={() => navigate('/onboarding-guide')}
                            className="text-gold-400 hover:text-white text-xs font-black uppercase tracking-widest border-b border-gold-500/30 hover:border-white pb-1 transition-all"
                        >
                            Review the 60-Second Handover Process
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeagueMembershipPage;
