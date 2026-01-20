import { EventSkillContext } from '../../types/skill';
import { VenueOpsService } from '../../services/VenueOpsService';

/**
 * handleUploadFile
 * Extracted from the "UPLOAD_FILE" case in useSchmidtOps.
 * Orchestrates the Vision-First extraction and slot-filling fallback logic.
 */
export const handleUploadFile = async (payload: string, ctx: EventSkillContext) => {
    const {
        venue,
        setIsLoading,
        setOpsState,
        addSchmidtResponse,
        eventDraft,
        setEventDraft,
        processAction
    } = ctx;

    if (!payload) return;
    setIsLoading(true);
    addSchmidtResponse("Schmidt is reading the flyer... 🧐");

    try {
        const vId = venue?.id || '';
        const extraction = await VenueOpsService.analyzeFlyer(vId, payload, new Date().toISOString());

        // Sync extraction results into eventDraft
        const currentDraft = {
            ...eventDraft,
            imageState: 'uploaded' as const,
            title: extraction.title || eventDraft.title,
            date: extraction.date || eventDraft.date,
            time: extraction.time || eventDraft.time,
            type: extraction.type || eventDraft.type,
            description: extraction.description || eventDraft.description
        };
        setEventDraft(currentDraft);
        setIsLoading(false);

        if (extraction.lcbViolationDetected) {
            addSchmidtResponse("⚠️ Heads up: Schmidt detected potential LCB compliance issues in this flyer. I've adjusted the description to be safe.");
        }

        // --- Smart Fallback Logic (Slot Filling) ---
        if (!currentDraft.title) {
            setOpsState('event_input_title');
            addSchmidtResponse("Schmidt read the flyer, but couldn't find a clear TITLE. What's the name of the event?");
            return;
        }

        if (!currentDraft.date) {
            setOpsState('event_input_date');
            addSchmidtResponse(`I've got "${currentDraft.title}" ready. What DATE is this happening?`, [
                { id: 'today', label: 'Today', value: 'SUBMIT_EVENT_TEXT', icon: '📅' },
                { id: 'tmrw', label: 'Tomorrow', value: 'SUBMIT_EVENT_TEXT', icon: '⏭️' }
            ]);
            return;
        }

        if (!currentDraft.time) {
            setOpsState('event_input_time');
            addSchmidtResponse(`Okay, ${currentDraft.date}. What TIME does it start?`, [
                { id: '7pm', label: '7:00 PM', value: 'SUBMIT_EVENT_TEXT', icon: '🕖' },
                { id: '8pm', label: '8:00 PM', value: 'SUBMIT_EVENT_TEXT', icon: '🕗' },
                { id: '9pm', label: '9:00 PM', value: 'SUBMIT_EVENT_TEXT', icon: '🕘' }
            ]);
            return;
        }

        if (!currentDraft.type) {
            setOpsState('event_input_type');
            addSchmidtResponse("Schmidt read the flyer, but couldn't be sure about the event CATEGORY. What type is this?", [
                { id: 'trivia', label: 'Trivia', value: 'SUBMIT_EVENT_TEXT', icon: '🧠' },
                { id: 'karaoke', label: 'Karaoke', value: 'SUBMIT_EVENT_TEXT', icon: '🎤' },
                { id: 'music', label: 'Live Music', value: 'SUBMIT_EVENT_TEXT', icon: '🎸' },
                { id: 'other', label: 'Other', value: 'SUBMIT_EVENT_TEXT', icon: '🎉' }
            ]);
            return;
        }

        if (!currentDraft.description) {
            setOpsState('event_input_details');
            addSchmidtResponse("Schmidt extracted the basics, but do you have any extra details or rules to add?");
            return;
        }

        // All slots filled -> Move to creative copy generation
        await processAction('generating_creative_copy');

    } catch (e: any) {
        setIsLoading(false);
        console.error("Flyer Extraction Error:", e);
        addSchmidtResponse(`Schmidt had trouble reading that: ${e.message}. Let's do it manually. What's the event title?`);
        setOpsState('event_input_title');
    }
};
