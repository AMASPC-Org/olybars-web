export interface SkillParam {
    name: string;
    description: string;
    required: boolean;
}

export type SkillCategory = 'PROMOTION' | 'PROFILE' | 'CONTENT_ENGINE' | 'IDEATION';

export interface ArtieSkill {
    id: string;
    name: string;
    description: string;
    category: SkillCategory;
    protocol: string;
    params: SkillParam[];
    actionTemplate: string;
}

export const ARTIE_SKILLS: Record<string, ArtieSkill> = {
    schedule_flash_deal: {
        id: 'schedule_flash_deal',
        name: 'Flash Bounty',
        description: 'Schedule a limited-time special offer.',
        category: 'PROMOTION',
        protocol: `
Collect and confirm these details:
1. Title (Punchy name, e.g., "$3 Wells")
2. Description & Terms (e.g., "All wells, limit 2, dine-in only")
3. Date & Start Time (e.g., "Tonight at 7pm", "Tomorrow at 4pm")
4. Duration (Maximum 180 minutes / 3 hours)
COMPLIANCE: Strictly forbid language implying rapid/excessive consumption.
PIT RULE: You MUST explicitly ask: "Have you told your staff/bartender about this deal?" before confirming.
LEAD TIME: All deals must be scheduled at least 180 minutes (3 hours) in advance.
TRAFFIC: If the slot is "BUSY", warn the user they will rotate with up to 2 other bars on the homepage.`,
        params: [
            { name: 'summary', description: 'Title of the deal', required: true },
            { name: 'details', description: 'Description and terms', required: true },
            { name: 'startTimeISO', description: 'ISO string of the start time', required: true },
            { name: 'duration', description: 'Duration in minutes', required: true },
            { name: 'staffBriefingConfirmed', description: 'Boolean confirming staff is aware', required: true },
            { name: 'price', description: 'Optional price string', required: false }
        ],
        actionTemplate: '[ACTION]: {"skill": "schedule_flash_deal", "params": {"summary": "{{summary}}", "details": "{{details}}", "startTimeISO": "{{startTimeISO}}", "duration": "{{duration}}", "staffBriefingConfirmed": {{staffBriefingConfirmed}}, "price": "{{price}}"}}'
    },
    update_hours: {
        id: 'update_hours',
        name: 'Update Hours',
        description: 'Update the regular hours of operation.',
        category: 'PROFILE',
        protocol: `
Collect the new hours for the venue. 
Be sure to clarify if it is for specific days or the entire week.
Confirm the new hours string (e.g., "Mon-Fri 4pm-10pm, Sat-Sun 12pm-11pm").`,
        params: [
            { name: 'hours', description: 'The formatted hours string', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "update_hours", "params": {"hours": "{{hours}}"}}'
    },
    update_happy_hour: {
        id: 'update_happy_hour',
        name: 'Happy Hour',
        description: 'Update the happy hour specials and times.',
        category: 'PROMOTION',
        protocol: `
Collect the happy hour details:
1. Days/Times (e.g., "Daily 3pm-6pm")
2. Specials (e.g., "$1 off drafts, $5 snacks")
Confirm both before generating action.`,
        params: [
            { name: 'schedule', description: 'Days and times of happy hour', required: true },
            { name: 'specials', description: 'Summary of deals', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "update_happy_hour", "params": {"schedule": "{{schedule}}", "specials": "{{specials}}"}}'
    },
    add_event: {
        id: 'add_event',
        name: 'Add Event',
        description: 'Add an upcoming event like Trivia, Live Music, or Karaoke.',
        category: 'PROMOTION',
        protocol: `
Collect event details:
1. Type (Trivia, Karaoke, Music, etc.)
2. Day/Time (e.g., "Tomorrow at 7pm")
3. Description (Optional details)
Confirm the event details.
COMPLIANCE: Ensure the event does not reward points for alcohol purchase and avoids "Anti-Volume" marketing.`,
        params: [
            { name: 'type', description: 'Type of event', required: true },
            { name: 'time', description: 'When it starts', required: true },
            { name: 'description', description: 'Additional info', required: false }
        ],
        actionTemplate: '[ACTION]: {"skill": "add_event", "params": {"type": "{{type}}", "time": "{{time}}", "description": "{{description}}"}}'
    },
    update_profile: {
        id: 'update_profile',
        name: 'Update Profile',
        description: 'Update website, social handles, or venue description.',
        category: 'PROFILE',
        protocol: `
Identify which fields the user wants to update:
1. Website
2. Instagram / Facebook handles
3. Description / Bio
Confirm the specific changes before generating the action.`,
        params: [
            { name: 'website', description: 'Venue website URL', required: false },
            { name: 'instagram', description: 'Instagram handle', required: false },
            { name: 'facebook', description: 'Facebook page URL or handle', required: false },
            { name: 'description', description: 'Venue description/bio', required: false }
        ],
        actionTemplate: '[ACTION]: {"skill": "update_profile", "params": {"website": "{{website}}", "instagram": "{{instagram}}", "facebook": "{{facebook}}", "description": "{{description}}"}}'
    },
    draft_social_post: {
        id: 'draft_social_post',
        name: 'Draft Social Post',
        description: 'Generate marketing copy for social media.',
        category: 'CONTENT_ENGINE',
        protocol: `
1. Ask what the post is about (Event, Deal, Vibe).
2. Generate a punchy, engaging caption.
3. COMPLIANCE: Must adhere to LCB rules (Safe ride mention, no chugging).
4. Present the draft for the user to "Save to Drafts".`,
        params: [
            { name: 'topic', description: 'What the post is about', required: true },
            { name: 'copy', description: 'The generated caption text', required: true },
            { name: 'platform', description: 'Instagram, Facebook, etc.', required: false }
        ],
        actionTemplate: '[ACTION]: {"skill": "draft_social_post", "params": {"topic": "{{topic}}", "copy": "{{copy}}", "platform": "{{platform}}"}}'
    },
    ideate_event: {
        id: 'ideate_event',
        name: 'Event Ideation',
        description: 'Brainstorm creative event ideas for the venue.',
        category: 'IDEATION',
        protocol: `
1. Research the venue's vibe.
2. Provide 2-3 creative event concepts (e.g., "90s Arcade Night", "Local Maker Pop-up").
3. Include a brief description for each.
4. If the user likes one, generate a draft for them.`,
        params: [
            { name: 'concepts', description: 'The brainstormed ideas', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "ideate_event", "params": {"concepts": "{{concepts}}"}}'
    },
    add_menu_item: {
        id: 'add_menu_item',
        name: 'Add Menu Item',
        description: 'Add a new food or drink item to the venue menu.',
        category: 'PROFILE',
        protocol: `
Collect and confirm:
1. Category (Drink / Food)
2. Name (e.g., "Artesian IPA")
3. Description (e.g., "Local citrus-forward hop bomb")
4. Price (Optional, e.g., "$7")
Confirm the details before saving.`,
        params: [
            { name: 'category', description: 'Drink or Food', required: true },
            { name: 'name', description: 'Name of the item', required: true },
            { name: 'description', description: 'Details/Ingredients', required: true },
            { name: 'price', description: 'Price string', required: false }
        ],
        actionTemplate: '[ACTION]: {"skill": "add_menu_item", "params": {"category": "{{category}}", "name": "{{name}}", "description": "{{description}}", "price": "{{price}}"}}'
    },
    promote_menu_item: {
        id: 'promote_menu_item',
        name: 'Promote Menu Item',
        description: 'Create a social post focusing on a specific menu item.',
        category: 'CONTENT_ENGINE',
        protocol: `
1. Identify the item to promote.
2. Draft a social post that highlights the flavor and vibe.
3. COMPLIANCE: Must adhere to LCB rules (Safe ride mention, no chugging).
4. Present for "Save to Drafts".`,
        params: [
            { name: 'item_name', description: 'The name of the item being promoted', required: true },
            { name: 'copy', description: 'The generated caption text', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "promote_menu_item", "params": {"item_name": "{{item_name}}", "copy": "{{copy}}"}}'
    },
    emergency_closure: {
        id: 'emergency_closure',
        name: 'Emergency Closure',
        description: 'Temporarily close the venue for the rest of the day or a specific duration.',
        category: 'PROFILE',
        protocol: `
1. Confirm the reason for closure (e.g., "Snow day", "Private event").
2. Confirm the duration (e.g., "Rest of today", "Until tomorrow morning").
3. WARNING: This will remove the venue from the Buzz Clock and search results for today.
4. Future events scheduled after this window will remain visible.`,
        params: [
            { name: 'reason', description: 'Reason for closure', required: true },
            { name: 'duration', description: 'How long (e.g. 1 day, rest of today)', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "emergency_closure", "params": {"reason": "{{reason}}", "duration": "{{duration}}"}}'
    },
    update_order_url: {
        id: 'update_order_url',
        name: 'Update Order URL',
        description: 'Change the online ordering or direct menu link.',
        category: 'PROFILE',
        protocol: `
1. Collect the new URL.
2. Confirm it starts with http:// or https://.
3. Update the venue profile link.`,
        params: [
            { name: 'url', description: 'The new ordering/menu URL', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "update_order_url", "params": {"url": "{{url}}"}}'
    },
    update_capacity: {
        id: 'update_capacity',
        name: 'Update Capacity',
        description: 'Update the maximum occupancy/capacity of the venue.',
        category: 'PROFILE',
        protocol: `
1. Identify the new capacity number.
2. Confirm the number before updating.`,
        params: [
            { name: 'capacity', description: 'The maximum occupancy number', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "update_capacity", "params": {"capacity": {{capacity}}}}'
    },
    draft_email: {
        id: 'draft_email',
        name: 'Draft Email',
        description: 'Draft a marketing email or newsletter.',
        category: 'CONTENT_ENGINE',
        protocol: `
1. Identify the subject and target audience.
2. Draft a professional email with clear CTAs.
3. COMPLIANCE: No chugging/binge encouragement. // @guardrail-ignore
4. Save to dashboard for deployment.`,
        params: [
            { name: 'subject', description: 'Email subject line', required: true },
            { name: 'body', description: 'The email content', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "draft_email", "params": {"subject": "{{subject}}", "body": "{{body}}"}}'
    },
    add_to_calendar: {
        id: 'add_to_calendar',
        name: 'Add to Calendar',
        description: 'Draft an entry for the community event calendar.',
        category: 'CONTENT_ENGINE',
        protocol: `
1. Collect event details (Name, Time, Vibe).
2. Draft a structured calendar entry.
3. Save to dashboard for final approval.`,
        params: [
            { name: 'summary', description: 'The event summary', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "add_to_calendar", "params": {"summary": "{{summary}}"}}'
    },
    update_website: {
        id: 'update_website',
        name: 'Update Website',
        description: 'Draft a content update for your website.',
        category: 'CONTENT_ENGINE',
        protocol: `
1. Identify the section to update (About, News).
2. Draft SEO-friendly copy.
3. Save to dashboard for manual deployment.`,
        params: [
            { name: 'content', description: 'The updated web copy', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "update_website", "params": {"content": "{{content}}"}}'
    },
    generate_image: {
        id: 'generate_image',
        name: 'Generate Image Prompt',
        description: 'Create a high-quality prompt for AI image generation.',
        category: 'CONTENT_ENGINE',
        protocol: `
1. Describe the desired scene (e.g. "a misty evening at the artesian well").
2. Reference Gemini 3.0 Flash for multimodal precision.
3. Provide the prompt for owner review.`,
        params: [
            { name: 'prompt', description: 'The image generation prompt', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "generate_image", "params": {"prompt": "{{prompt}}"}}'
    },
    promote_private_space: {
        id: 'promote_private_space',
        name: 'Promote Private Space',
        description: 'Create a social post or announcement for a specific private room or booth.',
        category: 'CONTENT_ENGINE',
        protocol: `
1. Identify the private space to promote (from the venue listing).
2. Ask about the target audience (Parties, Business meetings, Squads).
3. Draft a post highlighting capacity and unique features (AV, private bar).
4. COMPLIANCE: Safe ride mention mandatory for party/squad promos.`,
        params: [
            { name: 'space_name', description: 'Name of the private space', required: true },
            { name: 'copy', description: 'The generated caption text', required: true }
        ],
        actionTemplate: '[ACTION]: {"skill": "promote_private_space", "params": {"space_name": "{{space_name}}", "copy": "{{copy}}"}}'
    }
};
