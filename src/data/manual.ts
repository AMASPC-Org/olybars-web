export interface FAQItem {
    question: string;
    answer: string;
    category?: string;
}

export const manualFAQs: FAQItem[] = [
    // Category A: Account & Tech
    {
        "question": "Why can't I Clock In?",
        "category": "Account & Tech",
        "answer": "Clock-ins require you to be within 100 meters of the Anchor Venue (measured via GPS). If you're there but it's not working, ensure 'High Accuracy' location is enabled in your device settings."
    },
    {
        "question": "How do I manage my notifications?",
        "category": "Account & Tech",
        "answer": "Head to the 'Settings' tab in the Sidebar. From there, you can toggle alerts for 'Vibe is Alive', 'Favorite Deals', and 'League Intel' independently."
    },
    {
        "question": "Is my location data private?",
        "category": "Account & Tech",
        "answer": "Always. We only verify your presence at the moment of 'Clock In' or 'Vibe Check'. We do not track your movement or store persistent background location data."
    },
    {
        "question": "Is my data secure?",
        "category": "Account & Tech",
        "answer": "OlyBars uses Firebase Auth and Firestore for secure identity management. We only log actions required for points calculation and league standings."
    },
    {
        "question": "How do I change my Handle?",
        "category": "Account & Tech",
        "answer": "You can update your Handle once every 30 days in your Profile settings. This ensures League integrity and leaderboard consistency."
    },

    // Category B: The League
    {
        "question": "How do I join the League?",
        "category": "The League",
        "answer": "Open the Sidebar and tap 'Sign Up' or head to a Venue and perform any action. You'll need to create a Handle (username) to start banking points for glory."
    },
    {
        "question": "How do I earn the most points?",
        "category": "The League",
        "answer": "Maximize your Season Score by: 1) Clocking in early at Mellow venues (100 pts), 2) Supporting Local Makers (1.5x boost), 3) Clocking in during official Events (+50 bonus), and 4) Completing high-value Flash Bounties (up to 200 pts)."
    },
    {
        "question": "What are Flash Bounties?",
        "category": "The League",
        "answer": "Flash Bounties are venue-specific photo challenges. A bar might offer a bounty for snapping a photo of a specific drink special or a receipt. Upload the proof to claim instant points and support the venue's social marketing."
    },
    {
        "question": "How do Event Bonuses work?",
        "category": "The League",
        "answer": "If a venue has an approved 'League Event' (like Trivia or Karaoke) on the schedule, clocking in during that time window automatically triggers a +50 bonus. This stacks with your base Clock-In points!"
    },
    {
        "question": "What can I do with my League points?",
        "category": "The League",
        "answer": "Points determine your standing in the season leaderboard. Top players get invited to exclusive Artesian parties and get first dibs on limited-edition OlyBars merch."
    },
    {
        "question": "When do points reset?",
        "category": "The League",
        "answer": "Points are earned seasonally. At the end of a Season, top players are archived in the 'Artesian Hall of Fame' and global standings reset for the next run."
    },
    {
        "question": "What is a 'Ghost Score'?",
        "category": "The League",
        "answer": "A Ghost Score is points you've generated as a Guest but haven't 'Claimed'. Join the League before midnight to bank your Ghost Score into your permanent account."
    },
    {
        "question": "Can I earn points at Private Clubs?",
        "category": "The League",
        "answer": "Yes, but you must be a member or a legal guest. WSLCB regulations for private clubs (like the Eagles or Elks) supersede League rules. If you cannot legally enter, you cannot earn points."
    },

    // Category C: The Community
    {
        "question": "What are the Vibe Tiers?",
        "category": "The Community",
        "answer": "We use a 4-tier scale: Dead (Quiet, <20% cap), Chill (Easy conversation), Buzzing (High energy, table full), and Packed (Standing room only, party peaking!)."
    },
    {
        "question": "What defines a 'Dive' vs. 'Lounge'?",
        "category": "The Community",
        "answer": "It's about the Vibe. Dives prioritize utility/history over aesthetics. Lounges prioritize comfort/decor over volume. You can help tag venues in your Vibe Reports!"
    },
    {
        "question": "How do I report a fake Vibe check?",
        "category": "The Community",
        "answer": "If a venue is listed as 'Packed' but it's actually 'Dead', simply submit a Corrective Vibe Report. The system weighs recent, verified signals higher to self-heal data."
    },
    {
        "question": "Where do I find Live Music?",
        "category": "The Community",
        "answer": "Check the LIVE tab (Navigation Bar) for a dedicated gig guide and submission portal for local bands."
    },

    // Category D: System Intelligence
    {
        "question": "How do Pulse Alerts work?",
        "category": "System Intelligence",
        "answer": "Pulse Alerts keep you in the loop without the spam. Star a venue to 'Subscribe'. We'll dispatch a notification specifically when that spot hits 'Packed' status so you don't miss the peak!"
    },
    {
        "question": "What is Artie?",
        "category": "System Intelligence",
        "answer": "Artie is OlyBars' official AI concierge, powered by Well 80. He helps players find the right vibe and helps venue owners manage their marketing presence."
    },
    {
        "question": "What is The Weekly Buzz?",
        "category": "System Intelligence",
        "answer": "The Weekly Buzz is our community email that drops every Friday. It features bartender spotlights, local history, and curated 'Trivia Cheat Codes'."
    },
    {
        "question": "What is 'The Manual'?",
        "category": "System Intelligence",
        "answer": "The Manual is the definitive guide for both players and partners. For players, it's this Wiki. For partners, it's the 'Partner Manual' found in The Brew House dashboard."
    },

    // Category E: Partners
    {
        "question": "What is 'The Brew House'?",
        "category": "Partners",
        "answer": "The Brew House is the name for the OlyBars Owner Dashboard. It's where partners manage their listings, Flash Bounties, and Artie Marketing co-pilot."
    },
    {
        "question": "How does Artie help with marketing?",
        "category": "Partners",
        "answer": "Artie is a Multimodal Marketing Co-Pilot. Venue owners use him to generate social images, draft ad copy, and sync events to Instagram automatically."
    }
];
