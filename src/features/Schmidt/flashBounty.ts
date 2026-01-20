// TODO: Phase 4 - Refactor into specific subtypes: FoodBounty, DrinkBounty, TimeBounty.
import { SkillContext } from '../../types/skill';

export const handleFlashBountyInit = (ctx: SkillContext) => {
    ctx.addUserMessage('Flash Bounty');
    ctx.setOpsState('flash_deal_init_method');
    ctx.addSchmidtResponse("Target acquired. What kind of Flash Bounty are we deploying?", [
        { id: 'food', label: 'Food Special', value: 'bounty_food', icon: '🍔' },
        { id: 'drink', label: 'Drink Special', value: 'bounty_drink', icon: '🍸' },
        { id: 'time', label: 'Time Event', value: 'bounty_time', icon: '⏰' }
    ]);
};

export const handleTypeSelection = (action: string, ctx: SkillContext) => {
    const labels: Record<string, string> = {
        bounty_food: 'Food Special',
        bounty_drink: 'Drink Special',
        bounty_time: 'Time Event'
    };

    ctx.addUserMessage(labels[action] || 'Specialty Bounty');
    ctx.setDraftData((prev: any) => ({ ...prev, bountyType: action }));
    ctx.setOpsState('flash_deal_input');

    if (action === 'bounty_food') {
        ctx.addSchmidtResponse("Which menu item is the star?");
    } else if (action === 'bounty_drink') {
        ctx.addSchmidtResponse("What are we pouring?");
    } else if (action === 'bounty_time') {
        ctx.addSchmidtResponse("What's the occasion? (e.g. Happy Hour, late night)");
    }
};

export const handleMethodIdeation = (ctx: SkillContext) => {
    ctx.addUserMessage('Help me decide');
    ctx.setIsLoading(true);

    // Analyze high margin items
    const highMarginItems = ctx.venue?.fullMenu?.filter((item: any) => item.margin_tier === 'High') || [];

    if (highMarginItems.length > 0) {
        const pickedItem = highMarginItems[Math.floor(Math.random() * highMarginItems.length)];
        ctx.addSchmidtResponse(`I took a look at your menu. Your **${pickedItem.name}** has a great margin. \n\nHow about a Flash Bounty like: "$2 off ${pickedItem.name} for the next hour"?`, [
            { id: 'accept_idea', label: 'Sounds good', value: 'accept_ideation_proposal', icon: '✅' },
            { id: 'manual', label: 'I have a different idea', value: 'method_manual_input', icon: '📝' }
        ]);
        ctx.setDraftData({ pickedItem });
    } else {
        ctx.addSchmidtResponse("I'm still learning your menu! Once I have your food and drink list, I'll be able to suggest high-margin bounties. \n\nFor now, please enter the bounty manually.");
        setTimeout(() => {
            ctx.setOpsState('flash_deal_input');
            ctx.addSchmidtResponse("So, what's the bounty? (e.g., '$5 Pints until 8pm')");
        }, 1500);
    }
    ctx.setIsLoading(false);
};

export const handleAcceptIdeationProposal = async (ctx: SkillContext) => {
    const proposal = `$2 off ${ctx.draftData.pickedItem?.name} for the next hour`;
    ctx.addUserMessage('Sounds good');
    await ctx.processAction('SUBMIT_DEAL_TEXT', proposal);
};

export const handleMethodManualInput = (ctx: SkillContext) => {
    ctx.addUserMessage('I have a bounty');
    ctx.setOpsState('flash_deal_input');
    ctx.addSchmidtResponse("Got it. What's the offer? (e.g., 'Half price nachos', '$4 Wells')");
};

export const handleSubmitBountyText = async (payload: string | undefined, ctx: SkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setIsLoading(true);

    if (!ctx.validateLCBCompliance || !ctx.validateSchedule) {
        ctx.setIsLoading(false);
        ctx.addSchmidtResponse("⚠️ System error: Validators missing.");
        return;
    }

    const compliance = ctx.validateLCBCompliance(payload);

    if (!compliance.valid) {
        ctx.setIsLoading(false);
        ctx.addSchmidtResponse(`⚠️ Hold on. ${compliance.reason}`);
    } else {
        const now = new Date();
        const startTimeISO = now.toISOString();
        const duration = 60;

        const trafficCheck = await ctx.validateSchedule(startTimeISO, duration);
        if (!trafficCheck.valid) {
            ctx.setIsLoading(false);
            ctx.addSchmidtResponse(`⚠️ I can't schedule that. ${trafficCheck.reason}`);
        } else {
            ctx.setDraftData({
                ...ctx.draftData,
                skill: 'schedule_flash_deal',
                params: {
                    summary: payload,
                    details: "Limited time offer. See bartender for details.",
                    startTimeISO: startTimeISO,
                    duration: duration,
                    staffBriefingConfirmed: true,
                    price: "See details"
                }
            });

            const typeLabel = ctx.draftData.bountyType === 'bounty_food' ? 'Food' : ctx.draftData.bountyType === 'bounty_drink' ? 'Drink' : 'Time';

            ctx.setIsLoading(false);
            ctx.setOpsState('confirm_action');
            ctx.addSchmidtResponse(`Looks valid. I've drafted this **${typeLabel} Bounty**:\n\n"${payload}"\n\nStarting: NOW\nDuration: 1 Hour\n\nPost to the Buzz Clock?`, [
                { id: 'confirm', label: 'Post It', value: 'confirm_post', icon: '🚀' },
                { id: 'edit', label: 'Edit', value: 'skill_flash_deal', icon: '✏️' },
                { id: 'cancel', label: 'Cancel', value: 'cancel', icon: '❌' }
            ]);
        }
    }
};
