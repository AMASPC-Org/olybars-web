import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HISTORY_ARTICLES } from '../data/historyData';
import { Venue } from '../../../types';
import { ChevronLeft, Share2, EyeOff } from 'lucide-react';
import { VenueCard } from '../components/VenueCard';
import { HistoryFooter } from '../components/HistoryFooter';
import { useToast } from '../../../components/ui/BrandedToast';
import { SEO } from '../../../components/common/SEO';

interface HistoryArticleScreenProps {
    venues: Venue[];
}

export const HistoryArticleScreen: React.FC<HistoryArticleScreenProps> = ({ venues }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const article = HISTORY_ARTICLES.find(a => a.slug === slug);

    const generateArticleSchema = () => {
        if (!article) return null;

        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.subtitle,
            "image": article.coverImage,
            "author": {
                "@type": "Person",
                "name": article.author,
                "url": "https://olybars.com/meet-artie" // Assuming Artie or similar persona
            },
            "publisher": {
                "@type": "Organization",
                "name": "OlyBars",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://olybars.com/assets/Artie-Only-Logo.png"
                }
            },
            "datePublished": new Date().toISOString() // Fallback since article.date might be "Oct 2024"
        };

        return (
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        );
    };

    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);
    }, [slug]);

    if (!article) {
        return (
            <div className="flex h-full items-center justify-center p-10 flex-col text-center">
                <h2 className="text-2xl font-heading text-white mb-2">History Not Found</h2>
                <p className="text-slate-400 mb-6">The archivists seem to have misplaced this scroll.</p>
                <button
                    onClick={() => navigate('/history')}
                    className="px-6 py-2 bg-primary text-black rounded-lg font-bold"
                >
                    Return to Archive
                </button>
            </div>
        );
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.subtitle,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            showToast('Link copied to clipboard!', 'success');
        }
    };

    return (
        <div className="min-h-full bg-background pb-32">
            <SEO
                title={article.title}
                description={article.subtitle}
                ogImage={article.coverImage}
                ogType="article"
            />
            {generateArticleSchema()}
            {/* Header Image */}
            <div className="relative h-72 w-full">
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background z-10" />
                <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />

                {/* Nav Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/history')}
                        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Article Body */}
            <div className="max-w-xl mx-auto px-6 -mt-12 relative z-20">
                <div className="mb-8">
                    <div className="inline-block px-3 py-1 rounded bg-accent text-black text-xs font-bold uppercase tracking-wider mb-3">
                        {article.readingTime}
                    </div>
                    <h1 className="text-4xl font-heading text-white mb-4 leading-none">
                        {article.title}
                    </h1>
                    <p className="text-xl text-slate-300 font-body leading-relaxed border-l-2 border-accent/50 pl-4 py-1">
                        {article.subtitle}
                    </p>

                    <div className="flex items-center gap-2 mt-6 text-sm text-slate-500">
                        <span className="font-bold text-slate-400">By {article.author}</span>
                        <span>•</span>
                        <span>{article.date}</span>
                    </div>
                </div>

                {/* Content Blocks */}
                <div className="space-y-6">
                    {article.blocks.map((block, index) => {
                        if (block.type === 'heading') {
                            return <h2 key={index} className="text-2xl font-heading text-white mt-8 mb-4 border-b border-white/10 pb-2">{block.content}</h2>;
                        }
                        if (block.type === 'venue_card') {
                            const venue = venues.find(v => v.id === block.content);
                            if (!venue) return null;
                            return <VenueCard key={index} venue={venue} onClick={() => navigate(`/bars/${venue.id}`)} />;
                        }
                        if (block.type === 'hidden_fact') {
                            return (
                                <div key={index} className="bg-primary/10 border border-primary/30 rounded-lg p-6 my-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 bg-primary/20 p-2 rounded-br-lg">
                                        <EyeOff className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-primary font-mono text-sm leading-relaxed text-center font-bold">
                                        {block.content}
                                    </p>
                                </div>
                            );
                        }
                        if (block.type === 'image') {
                            return (
                                <div key={index} className="my-6 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                    <img src={block.content} alt={block.alt || 'History image'} className="w-full h-auto" />
                                    {block.alt && <p className="text-xs text-center text-slate-500 py-2 bg-black/20 italic">{block.alt}</p>}
                                </div>
                            );
                        }
                        // Default Text
                        return <p key={index} className="text-slate-300 font-body leading-loose text-lg">{block.content}</p>;
                    })}
                </div>

                {/* Footer */}
                <HistoryFooter />
            </div>
        </div>
    );
};
