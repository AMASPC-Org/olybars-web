import { SkillContext } from '../../types/skill';

/**
 * SKILL: Generate Image Prompt Builder
 */
export const handleImageGenInit = (ctx: SkillContext) => {
    ctx.addUserMessage('Gen Image');
    ctx.setOpsState('image_gen_purpose');
    ctx.addSchmidtResponse("I'm on it. To get the perfect result, I need a little intel. \n\nWhat is this image for?", [
        { id: '1', label: 'Social Media', value: 'purpose_social', icon: '📱' },
        { id: '2', label: 'Website', value: 'purpose_web', icon: '🌐' },
        { id: '3', label: 'Print Flyer', value: 'purpose_print', icon: '📄' },
        { id: '4', label: 'Member Only', value: 'purpose_exclusive', icon: '👑' }
    ]);
};

export const handleSubmitPurpose = (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setDraftData((prev: any) => ({ ...prev, purpose: payload }));
    ctx.setOpsState('image_gen_goal');
    ctx.addSchmidtResponse(`Got it, a ${payload}. \n\nWhat's the main goal of this asset?`, [
        { id: '1', label: 'Promote Event', value: 'goal_event', icon: '📅' },
        { id: '2', label: 'Showcase Menu', value: 'goal_menu', icon: '🍔' },
        { id: '3', label: 'Daily Vibe', value: 'goal_vibe', icon: '✨' },
        { id: '4', label: 'Hiring/Team', value: 'goal_hiring', icon: '🤝' }
    ]);
};

export const handleSubmitGoal = (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setDraftData((prev: any) => ({ ...prev, goal: payload }));

    if (payload.toLowerCase().includes('event')) {
        ctx.setOpsState('image_gen_event');
        ctx.addSchmidtResponse("Tell me about the event. (e.g. 'Trivia Night, 8pm, high energy')");
    } else {
        ctx.setOpsState('image_gen_audience');
        ctx.addSchmidtResponse("Who's the target audience for this? (e.g. 'Regulars', 'Families', 'Night owls')");
    }
};

export const handleSubmitEventDetails = (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setDraftData((prev: any) => ({ ...prev, eventDetails: payload }));
    ctx.setOpsState('image_gen_audience');
    ctx.addSchmidtResponse("Solid. And who's the target audience? (e.g. 'Late night party crowd', 'Craft beer lovers')");
};

export const handleSubmitAudience = (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);

    // [HEURISTIC] Check for time corrections mid-interview (e.g. "actually it's at 8pm")
    const timeMatch = payload.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
        ctx.setDraftData((prev: any) => {
            const newDetails = prev.eventDetails
                ? prev.eventDetails.replace(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i, timeMatch[0])
                : `Event at ${timeMatch[0]}`;
            return { ...prev, eventDetails: newDetails };
        });
    }

    ctx.setDraftData((prev: any) => ({ ...prev, audience: payload }));
    ctx.setOpsState('image_gen_specials');
    ctx.addSchmidtResponse("Are there any specific specials or details I should include in the visual context?", [
        { id: 'none', label: 'Just the vibe', value: 'no_specials' }
    ]);
};

export const handleSubmitSpecials = (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setDraftData((prev: any) => ({ ...prev, specials: payload === 'no_specials' ? 'None' : payload }));
    ctx.setOpsState('image_gen_context');
    ctx.addSchmidtResponse("Final question—do you have any specific input or creative context you'd like me to follow? (Colors, lighting, specific items)");
};

export const handleSubmitContext = async (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setIsLoading(true);

    const finalData = { ...ctx.draftData, context: payload };
    const prompt = `A high-end, professionally shot marketing image for ${ctx.venue?.name || 'an Olympia Bar'}.
Purpose: ${finalData.purpose}.
Goal: ${finalData.goal}.
${finalData.eventDetails ? `Focusing on: ${finalData.eventDetails}.` : ''}
Targeting: ${finalData.audience}.
Details to hint at: ${finalData.specials}.
Style/Vibe: ${finalData.context}.
Maintain the OlyBars brand aesthetic: Local, authentic, and vibrant Olympia energy. Use brand colors if applicable.`;

    ctx.setDraftData({
        skill: 'generate_image',
        params: {
            prompt: prompt,
            ...finalData
        }
    });

    ctx.setIsLoading(false);
    ctx.setOpsState('confirm_action');
    ctx.addSchmidtResponse(`Artie is firing up the kiln... 🎨\n\nI've generated a multimodal prompt based on our brief: \n\n"${prompt}"\n\nGenerate and save to your dashboard?`, [
        { id: 'confirm', label: 'Generate', value: 'confirm_post', icon: '🎨' },
        { id: 'cancel', label: 'Cancel', value: 'cancel', icon: '❌' }
    ]);
};

export const handlePostImageGen = (ctx: SkillContext) => {
    ctx.setOpsState('post_image_gen');
    ctx.addSchmidtResponse("Visual assets are staged. Shall I draft the high-engagement social copy to go with this visual?", [
        { id: 'draft_copy', label: 'Draft Ad Copy', value: 'skill_ad_copy', icon: '✍️' },
        { id: 'edit_vis', label: 'Edit Visual', value: 'skill_generate_image', icon: '🎨' },
        { id: 'finish', label: 'All Done', value: 'completed', icon: '✅' }
    ]);
};
