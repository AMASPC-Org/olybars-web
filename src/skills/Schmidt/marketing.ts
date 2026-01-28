import { SkillContext, EventSkillContext } from '../../types/skill';
import { VenueOpsService } from '../../services/VenueOpsService';

/**
 * SKILL: Social Media Post
 */
export const handleSocialPostInit = (ctx: SkillContext) => {
    ctx.addUserMessage('Social Post');
    ctx.setOpsState('social_post_input');
    ctx.addSchmidtResponse("I'm ready to draft. What's the post about? (e.g. 'New IPA on tap', 'Live music at 8pm')");
};

export const handleSubmitSocialText = async (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setIsLoading(true);

    const draft = `✨ OLYBARS EXCLUSIVE ✨\n\n${payload} at ${ctx.venue?.name || 'our place'}! \n\nCome down and join the vibe. 🍻\n\n#OlyBars #Olympia #Nightlife`;

    ctx.setDraftData({
        skill: 'promote_menu_item',
        params: {
            item_name: 'Special Update',
            copy: draft
        }
    });

    ctx.setIsLoading(false);
    ctx.setOpsState('confirm_action');
    ctx.addSchmidtResponse(`I've drafted this for you:\n\n"${draft}"\n\nSave to your marketing dashboard?`, [
        { id: 'confirm', label: 'Save Draft', value: 'confirm_post', icon: '🚀' },
        { id: 'gen_img', label: 'Gen Image', value: 'skill_generate_image', icon: '🎨' },
        { id: 'cancel', label: 'Cancel', value: 'cancel', icon: '❌' }
    ]);
};

/**
 * SKILL: Email Newsletter Draft
 */
export const handleEmailDraftInit = (ctx: SkillContext) => {
    ctx.addUserMessage('Draft Email');
    ctx.setOpsState('email_draft_input');
    ctx.addSchmidtResponse("Who are we emailing, and what's the occasion? (e.g. 'Newsletter to regulars about Saturday trivia')");
};

export const handleSubmitEmailText = async (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setIsLoading(true);

    const emailDraft = `Subject: Big News from ${ctx.venue?.name || 'OlyBars'}! 🍻\n\nHi everyone,\n\n${payload}\n\nWe can't wait to see you there!\n\nCheers,\nThe ${ctx.venue?.name || 'OlyBars'} Team`;

    ctx.setDraftData({
        skill: 'draft_email',
        params: {
            subject: `Update from ${ctx.venue?.name}`,
            body: emailDraft
        }
    });

    ctx.setIsLoading(false);
    ctx.setOpsState('confirm_action');
    ctx.addSchmidtResponse(`I've drafted this email:\n\n"${emailDraft}"\n\nSave to your marketing dashboard?`, [
        { id: 'confirm', label: 'Save Draft', value: 'confirm_post', icon: '🚀' },
        { id: 'cancel', label: 'Cancel', value: 'cancel', icon: '❌' }
    ]);
};

/**
 * SKILL: Ad Copy (Follow-up to Image Gen)
 */
export const handleAdCopyRequest = (ctx: SkillContext) => {
    ctx.addUserMessage('Draft Ad Copy');
    ctx.setIsLoading(true);

    // Structural mismatch fix: imageGen.ts nests params, social/email root it
    const data = ctx.draftData.params || ctx.draftData;

    const goal = data.goal || 'undefined';
    const audience = data.audience || 'undefined';
    const eventDetails = data.eventDetails || '';
    const specials = data.specials || 'None';
    const context = data.context || 'vibrant';

    const adCopy = `✨ NEW ASSET ALERT ✨\n\nGoal: ${goal}\nTarget: ${audience}\n\n"Come down to ${ctx.venue?.name || 'Hannah\'s'}! 🍻 ${eventDetails ? `We've got ${eventDetails} happening.` : ''} ${specials !== 'None' && specials !== 'no_specials' ? `Don't miss out on ${specials}!` : ''} Our vibe is always ${context} and we can't wait to see you!"\n\n#OlyBars #SocialMarketing #LocalVibes`;

    ctx.addSchmidtResponse(`Here is your suggested ad copy:\n\n---\n${adCopy}\n---\n\nWould you like to save this draft to your marketing suite?`, [
        { id: 'save_copy', label: 'Save Copy', value: 'completed', icon: '🚀' },
        { id: 'edit_copy', label: 'Edit', value: 'skill_social_post', icon: '✏️' }
    ]);
    ctx.setIsLoading(false);
};

/**
 * SKILL: Community Calendar Post (from Artie/cmsOps)
 */
export const handleCalendarPostInit = (ctx: SkillContext) => {
    ctx.addUserMessage('Calendar Post');
    ctx.setOpsState('calendar_post_input');
    ctx.addSchmidtResponse("What event should I add to the community calendar? (e.g. 'St Paddy's Day Bash, March 17th, 6pm')");
};

export const handleSubmitCalendarText = async (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setIsLoading(true);

    ctx.setDraftData({
        skill: 'add_to_calendar',
        params: {
            summary: payload,
            venueId: ctx.venue?.id
        }
    });

    ctx.setIsLoading(false);
    ctx.setOpsState('confirm_action');
    ctx.addSchmidtResponse(`I've prepared this calendar entry:\n\n"${payload}"\n\nPush it to the OlyBars calendar?`, [
        { id: 'confirm', label: 'Post It', value: 'confirm_post', icon: '✅' },
        { id: 'cancel', label: 'Cancel', value: 'cancel', icon: '❌' }
    ]);
};

/**
 * SKILL: Website Content Update (from Artie/cmsOps)
 */
export const handleWebsiteContentInit = (ctx: SkillContext) => {
    ctx.addUserMessage('Web Content');
    ctx.setOpsState('website_content_input');
    ctx.addSchmidtResponse("What page or section are we updating? (e.g. 'About Us section on the homepage')");
};

export const handleSubmitWebText = async (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setIsLoading(true);

    const webDraft = `New Content for ${ctx.venue?.name}:\n\n"${payload}"\n\n(Optimized for local SEO and mobile engagement)`;

    ctx.setDraftData({
        skill: 'update_website',
        params: {
            content: webDraft
        }
    });

    ctx.setIsLoading(false);
    ctx.setOpsState('confirm_action');
    ctx.addSchmidtResponse(`Web content drafted:\n\n"${webDraft}"\n\nSave this for your web dev?`, [
        { id: 'confirm', label: 'Save', value: 'confirm_post', icon: '✅' },
        { id: 'cancel', label: 'Cancel', value: 'cancel', icon: '❌' }
    ]);
};

/**
 * UTILITY: Marketing Copy Generator
 */
export const handleGeneratingCreativeCopy = async (payload: string | undefined, ctx: EventSkillContext) => {
    ctx.setOpsState('generating_creative_copy');
    ctx.setIsLoading(true);

    try {
        const requestedVibe = (payload && ['hype', 'relaxed', 'funny', 'standard'].includes(payload))
            ? (payload as 'hype' | 'relaxed' | 'funny' | 'standard')
            : (ctx.eventDraft.vibeMode || 'standard');

        const copy = await VenueOpsService.generateEventCopy(
            ctx.eventDraft,
            ctx.venue?.id || '',
            requestedVibe
        );

        ctx.setEventDraft((prev: any) => ({ ...prev, marketingCopy: copy }));
        ctx.setIsLoading(false);
        ctx.setOpsState('review_event_copy');

        ctx.addSchmidtResponse(`How does this blurb sound?\n\n"${copy}"`, [
            { id: 'copy_ok', label: 'Looks Great', value: 'copy_approved', icon: '✅' },
            { id: 'regen_hype', label: 'More Hype!', value: 'regen_hype', icon: '🔥' },
            { id: 'regen_relaxed', label: 'Relax the tone', value: 'regen_relaxed', icon: '🌊' },
            { id: 'regen_funny', label: 'Make it funny', value: 'regen_funny', icon: '😂' }
        ]);
    } catch (e: any) {
        ctx.setIsLoading(false);
        console.error("Copy Gen Failed:", e);
        ctx.addSchmidtResponse("Schmidt's creative engine stalled. Let's use the facts for now.", [
            { id: 'fallback', label: 'Use Facts', value: 'copy_approved' }
        ]);
    }
};
