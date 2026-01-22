import { EventSkillContext } from '../../types/skill';

/**
 * START: Adding an Event (Interview Mode)
 */
export const handleAddEventInit = (ctx: EventSkillContext) => {
    ctx.addUserMessage('Add Event');
    ctx.setEventDraft({ imageState: 'none' });
    ctx.setOpsState('event_init_check_flyer');
    ctx.addSchmidtResponse("Do you have an existing flyer or image for this event?", [
        { id: 'event_has_flyer', label: 'Yes, I have one', value: 'event_has_flyer', icon: '🖼️' },
        { id: 'event_no_flyer', label: 'No', value: 'event_no_flyer', icon: '📝' }
    ]);
};

/**
 * Step: User has a flyer
 */
export const handleHasFlyer = (ctx: EventSkillContext) => {
    ctx.addUserMessage('Yes, I have one');
    ctx.setOpsState('event_upload_wait');
    ctx.addSchmidtResponse("Great! Drag and drop it here (or click the paperclip).");
};

/**
 * Step: User does not have a flyer
 */
export const handleNoFlyer = (ctx: EventSkillContext) => {
    ctx.addUserMessage('No');
    ctx.setOpsState('event_init_check_gen');
    ctx.addSchmidtResponse("Would you like me to design a promotional image for you using the Artsian Spirit?", [
        { id: 'event_gen_flyer', label: 'Yes, Create One', value: 'event_gen_flyer', icon: '🎨' },
        { id: 'event_text_only', label: 'No, Just Text', value: 'event_text_only', icon: '📝' }
    ]);
};

/**
 * Step: Generate Flyer (Handoff to Schmidt)
 */
export const handleGenFlyerRequest = async (ctx: EventSkillContext) => {
    ctx.addUserMessage('Yes, Create One');
    ctx.setDraftData((prev: any) => ({ ...prev, isEventFlyer: true }));
    ctx.setEventDraft((prev: any) => ({ ...prev, imageState: 'generated' }));
    await ctx.processAction('skill_generate_image');
};

/**
 * Step: Text Only Event
 */
export const handleTextOnlyEvent = (ctx: EventSkillContext) => {
    ctx.addUserMessage('No, Just Text');
    ctx.setOpsState('event_input');
    ctx.addSchmidtResponse("Paste the event details (Name, Date, Time) or a link to the Facebook event.");
};

/**
 * Step: Edit existing draft
 */
export const handleEditEvent = (ctx: EventSkillContext) => {
    ctx.setOpsState('event_input');
    ctx.addSchmidtResponse("Okay, let's fix the details. Paste the correct info or type what you want to change.");
};

/**
 * CORE: The Event Details Interview State Machine
 */
export const handleSubmitEventText = async (payload: string | undefined, ctx: EventSkillContext) => {
    if (!payload) return;
    ctx.addUserMessage(payload);
    ctx.setIsLoading(true);

    const currentDraft = { ...ctx.eventDraft };
    const lowerPayload = payload.toLowerCase();

    // 1. State-Based Capture
    if (ctx.currentOpsState === 'event_input_details') {
        currentDraft.description = payload;
    } else if (ctx.currentOpsState === 'event_input_type') {
        currentDraft.type = payload.toLowerCase().replace(' ', '_') as any;
    } else if (ctx.currentOpsState === 'event_input_prizes') {
        currentDraft.prizes = payload;
    } else if (ctx.currentOpsState === 'event_input_date') {
        if (lowerPayload.includes('today') || lowerPayload.includes('tonig')) {
            currentDraft.date = new Date().toISOString().split('T')[0];
        } else if (lowerPayload.includes('tomorrow') || lowerPayload.includes('tomm')) {
            const tmrw = new Date();
            tmrw.setDate(tmrw.getDate() + 1);
            currentDraft.date = tmrw.toISOString().split('T')[0];
        } else {
            const dateMatch = payload.match(/(\d{1,2})[/-](\d{1,2})([/-](\d{2,4}))?/);
            if (dateMatch) currentDraft.date = dateMatch[0];
        }
    }

    // 2. Heuristic Parsing
    if (!currentDraft.type) {
        if (lowerPayload.includes('trivia')) currentDraft.type = 'trivia';
        else if (lowerPayload.includes('karaoke')) currentDraft.type = 'karaoke';
        else if (lowerPayload.includes('music') || lowerPayload.includes('band') || lowerPayload.includes('live')) currentDraft.type = 'live_music';
        else if (lowerPayload.includes('bingo')) currentDraft.type = 'bingo';
        else if (lowerPayload.includes('mic') || lowerPayload.includes('comedy')) currentDraft.type = 'openmic';
    }

    // Time Parsing
    let timeMatchResult = payload.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (!timeMatchResult) {
        const strictMatch = payload.match(/(\d{1,2})[:.](\d{2})/);
        if (strictMatch) {
            timeMatchResult = [strictMatch[0], strictMatch[1], strictMatch[2], undefined as any] as any;
        }
    }
    if (timeMatchResult) {
        const h = timeMatchResult[1];
        const m = timeMatchResult[2] || '00';
        const mer = timeMatchResult[3];
        if (mer) {
            let hour = parseInt(h);
            if (mer.toLowerCase() === 'pm' && hour < 12) hour += 12;
            if (mer.toLowerCase() === 'am' && hour === 12) hour = 0;
            currentDraft.time = `${hour}:${m}`;
        } else {
            currentDraft.time = `${h}:${m}`;
        }
    }

    // Date Parsing (if not caught by state)
    if (!currentDraft.date) {
        if (lowerPayload.includes('today') || lowerPayload.includes('tonig')) {
            currentDraft.date = new Date().toISOString().split('T')[0];
        } else if (lowerPayload.includes('tomorrow') || lowerPayload.includes('tomm')) {
            const tmrw = new Date();
            tmrw.setDate(tmrw.getDate() + 1);
            currentDraft.date = tmrw.toISOString().split('T')[0];
        } else {
            const dateMatch = payload.match(/(\d{1,2})[/-](\d{1,2})([/-](\d{2,4}))?/);
            if (dateMatch) currentDraft.date = dateMatch[0];
        }
    }

    // Title Parsing
    const isShortInput = payload.length < 15;
    const matchesDateOrTime = timeMatchResult || lowerPayload.includes('today') || lowerPayload.includes('tonig') || lowerPayload.includes('tomorrow') || lowerPayload.includes('tomm');
    const isJustDateOrTime = matchesDateOrTime && isShortInput;

    if (!currentDraft.title && !isJustDateOrTime && payload.length > 3) {
        if (!/^\d+$/.test(payload)) {
            let cleanedTitle = payload;
            if (timeMatchResult && timeMatchResult[0]) cleanedTitle = cleanedTitle.replace(timeMatchResult[0], '');
            cleanedTitle = cleanedTitle.replace(/today|tonight|tomorrow/gi, '');
            cleanedTitle = cleanedTitle.replace(/\s+at\s*$/i, '').replace(/^\s*at\s+/i, '');

            const lowerTitle = cleanedTitle.toLowerCase();
            const isConversationalTrigger = (lowerTitle.includes('event') && lowerTitle.includes('calendar')) || lowerTitle.startsWith('i am having') || lowerTitle.startsWith('i need to');
            if (!isConversationalTrigger) {
                currentDraft.title = cleanedTitle.trim();
            }
        }
    }

    // 3. Slot Filling Check
    if (!currentDraft.title) {
        ctx.setOpsState('event_input_title');
        ctx.setIsLoading(false);
        ctx.addSchmidtResponse("I didn't catch the name. What is the OFFICIAL title of the event?");
        return;
    }

    ctx.setEventDraft(currentDraft);
    ctx.setIsLoading(false);

    if (!currentDraft.date) {
        ctx.setOpsState('event_input_date');
        ctx.addSchmidtResponse("Got it. What date is this happening?", [
            { id: 'today', label: 'Today', value: 'SUBMIT_EVENT_TEXT', icon: '📅' },
            { id: 'tmrw', label: 'Tomorrow', value: 'SUBMIT_EVENT_TEXT', icon: '⏭️' }
        ]);
        return;
    }

    if (!currentDraft.time) {
        ctx.setOpsState('event_input_time');
        ctx.addSchmidtResponse(`Okay, ${currentDraft.date}. What time does it start?`, [
            { id: '7pm', label: '7:00 PM', value: 'SUBMIT_EVENT_TEXT', icon: '🕖' },
            { id: '8pm', label: '8:00 PM', value: 'SUBMIT_EVENT_TEXT', icon: '🕗' },
            { id: '9pm', label: '9:00 PM', value: 'SUBMIT_EVENT_TEXT', icon: '🕘' }
        ]);
        return;
    }

    if (!currentDraft.type) {
        ctx.setOpsState('event_input_type');
        ctx.addSchmidtResponse("What kind of event is this?", [
            { id: 'trivia', label: 'Trivia', value: 'SUBMIT_EVENT_TEXT', icon: '🧠' },
            { id: 'karaoke', label: 'Karaoke', value: 'SUBMIT_EVENT_TEXT', icon: '🎤' },
            { id: 'music', label: 'Live Music', value: 'SUBMIT_EVENT_TEXT', icon: '🎸' },
            { id: 'other', label: 'Other', value: 'SUBMIT_EVENT_TEXT', icon: '🎉' }
        ]);
        return;
    }

    if (!currentDraft.prizes && (currentDraft.type === 'trivia' || currentDraft.type === 'bingo')) {
        ctx.setOpsState('event_input_prizes');
        ctx.addSchmidtResponse("Winner's circle intel: What are the prizes? (e.g. $50 Venue Tab, OlyBars T-Shirt)");
        return;
    }

    if (!currentDraft.description && payload.toLowerCase() !== 'none') {
        ctx.setOpsState('event_input_details');
        let promptText = "Any rules or details I should mention? (Or type 'none' to skip)";
        const t = currentDraft.type;
        if (t === 'live_music') promptText = "Is there a cover charge? Who is opening?";
        else if (t === 'karaoke') promptText = "Any drink specials for singers?";
        ctx.addSchmidtResponse(promptText);
        return;
    }

    // 4. Final collection complete -> Handoff to Schmidt for Creative Copy
    await ctx.processAction('generating_creative_copy');
};

/**
 * FINAL: Approval and Scheduling
 */
export const handleCopyApproved = (ctx: EventSkillContext) => {
    const { eventDraft, venue } = ctx;

    // [CRITICAL] Sanity Check for Undefined Fields
    if (!eventDraft.title || !eventDraft.date || !eventDraft.time) {
        ctx.addSchmidtResponse("Wait—Schmidt's internal log shows some missing pieces (Title, Date, or Time). Let's double-check the details.", [
            { id: 'fix_details', label: 'Fix Details', value: 'edit_event', icon: '✏️' }
        ]);
        ctx.setOpsState('event_input');
        return;
    }

    ctx.addUserMessage('Looks Great');
    ctx.setOpsState('confirm_action');

    ctx.setDraftData({
        skill: 'add_calendar_event',
        params: {
            ...eventDraft,
            description: eventDraft.marketingCopy || eventDraft.description || `${eventDraft.title} on ${eventDraft.date}`,
            venueName: venue?.name || '',
            summary: `${eventDraft.title} on ${eventDraft.date}`
        }
    });

    const [h, m] = (eventDraft.time || '20:00').split(':');
    let hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const displayTime = `${hour12}:${m} ${ampm}`;

    ctx.addSchmidtResponse(`Ready to schedule!\n\n**${eventDraft.title}**\n${eventDraft.date} @ ${displayTime}\n\n"${eventDraft.marketingCopy || eventDraft.description}"\n\nConfirm adding this to the schedule?`, [
        { id: 'confirm', label: 'Post It', value: 'confirm_post', icon: '✅' },
        { id: 'gen_img', label: 'Gen Image', value: 'skill_generate_image', icon: '🎨' },
        { id: 'cancel', label: 'Cancel', value: 'cancel', icon: '❌' }
    ]);
};
