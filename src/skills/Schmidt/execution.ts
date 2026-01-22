import { EventSkillContext } from '../../types/skill';
import { VenueOpsService } from '../../services/VenueOpsService';

/**
 * handleConfirmAction
 * Extracted from the "confirm_post" case in useSchmidtOps.
 * Handles the final commitment of drafted data to the database/API.
 */
export const handleConfirmAction = async (ctx: EventSkillContext) => {
    const {
        draftData,
        venue,
        setIsLoading,
        setOpsState,
        addSchmidtResponse,
        addSchmidtMessage,
        eventDraft,
        processAction
    } = ctx;

    setIsLoading(true);

    // Specialized "Stage to Slot" routing for complex multi-part images
    if (draftData.skill === 'generate_image' && draftData.isEventFlyer) {
        setOpsState('event_input');
        addSchmidtResponse("Visual assets are staged! Now, paste the event details (Name, Date, Time) so I can link them.");
        setIsLoading(false);
        return;
    }

    try {
        let result: { success: boolean; error?: string; id?: string };
        const vId = venue?.id || '';

        if (!vId) {
            addSchmidtResponse("Error: Venue ID missing. Please restart the session.");
            setIsLoading(false);
            return;
        }

        // Logic routing based on the skill recorded in draftData
        switch (draftData.skill) {
            case 'schedule_flash_deal':
                result = await VenueOpsService.scheduleFlashBounty(vId, draftData.params);
                break;
            case 'add_calendar_event':
                result = await VenueOpsService.submitCalendarEvent(vId, draftData.params);
                break;
            case 'promote_menu_item':
                // Reusing for general social posts
                result = await VenueOpsService.saveDraft(vId, {
                    topic: draftData.params.item_name,
                    copy: draftData.params.copy,
                    type: 'social'
                });
                break;
            case 'draft_email':
                result = await VenueOpsService.draftEmail(vId, draftData.params);
                break;
            case 'add_to_calendar':
                result = await VenueOpsService.addToCalendar(vId, draftData.params);
                break;
            case 'update_website':
                result = await VenueOpsService.updateWebsite(vId, draftData.params);
                break;
            case 'generate_image':
                result = await VenueOpsService.generateImage(vId, draftData.params);
                break;
            default:
                result = { success: false, error: `Unknown skill: ${draftData.skill}` };
        }

        if (result.success) {
            setOpsState('completed');
            let doneMsg = `Mission achieved! **${draftData.skill.replace(/_/g, ' ')}** is live.`;

            if (draftData.skill === 'add_calendar_event') {
                const eventLink = `/bars/${vId}/events`;
                if (eventDraft.imageState !== 'none') {
                    doneMsg = "Event & Assets Saved! Would you like to distribute this to social media now?";
                    addSchmidtResponse(doneMsg, [
                        { id: 'post_socials', label: 'Post to Socials', value: 'skill_social_post', icon: '📱' },
                        { id: 'done', label: 'Done', value: 'cancel', icon: '✅' }
                    ]);
                } else {
                    doneMsg = `Event Created! View it here: [See Event](${eventLink})`;
                    addSchmidtResponse(doneMsg, [
                        { id: 'new', label: 'New Mission', value: 'START_SESSION', icon: '🚀' },
                        { id: 'done', label: 'Done', value: 'cancel', icon: '✅' }
                    ]);
                }
            } else if (draftData.skill === 'generate_image') {
                const imgUrl = (result as any).imageUrl;
                if (imgUrl) addSchmidtMessage("Here is your specialized visual asset:", imgUrl);
                addSchmidtResponse(`${doneMsg} Would you like to write some copy for this?`, [
                    { id: 'write_copy', label: 'Write Ad Copy', value: 'skill_ad_copy', icon: '📝' },
                    { id: 'done', label: 'Done', value: 'cancel', icon: '✅' }
                ]);
            } else {
                addSchmidtResponse(`${doneMsg} What's next?`, [
                    { id: 'new', label: 'New Mission', value: 'START_SESSION', icon: '🚀' },
                    { id: 'done', label: 'Done', value: 'cancel', icon: '✅' }
                ]);
            }
        } else {
            addSchmidtResponse(`⚠️ Action failed: ${result.error || "Please try again."}`);
        }
    } catch (e: any) {
        console.error("Execution Error:", e);
        addSchmidtResponse(`🚨 Unexpected system error: ${e.message || "Contact Support"}`);
    } finally {
        setIsLoading(false);
    }
};
