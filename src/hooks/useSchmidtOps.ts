// File: src/hooks/useSchmidtOps.ts
import { useState, useCallback, useMemo } from 'react';
import { QuickReplyOption } from '../components/artie/QuickReplyChips';
import { VenueOpsService } from '../services/VenueOpsService';
import { SkillContext, EventSkillContext } from '../types/skill';
import { ChatMessage } from '../types/chat'; // Unified Type
import { SchmidtOpsState } from '../features/Schmidt/types';

// Modular Skill Handlers - PURE SCHMIDT
import * as SchmidtBounty from '../features/Schmidt/flashBounty';
import * as SchmidtImages from '../features/Schmidt/imageGen';
import * as SchmidtContent from '../features/Schmidt/contentOps';
import * as SchmidtEvents from '../features/Schmidt/eventOps';
import * as SchmidtExecution from '../features/Schmidt/execution';
import * as SchmidtExtraction from '../features/Schmidt/eventExtraction';

// 2. Regulatory Guardrails (LCB Compliance)
const LCB_FORBIDDEN_TERMS = ['free alcohol', 'free beer', 'free shots', 'free drinks', 'unlimited', 'bottomless', 'complimentary', 'giveaway', '0.00', '$0'];
const ALCOHOL_TERMS = ['beer', 'wine', 'shots', 'cocktails', 'drinks', 'booze', 'ipa', 'stout', 'pilsner', 'mimosas', 'tequila', 'whiskey', 'vodka', 'gin', 'rum'];

// Helper Interface for building the event step-by-step
interface EventDraft {
    title?: string;
    date?: string;
    time?: string;
    description?: string;
    prizes?: string;
    marketingCopy?: string;
    vibeMode?: 'hype' | 'chill' | 'funny' | 'standard';
    type?: string;
    imageState: 'none' | 'uploaded' | 'generated';
    imageUrl?: string;
}

export const useSchmidtOps = () => {
    // No more 'persona' state - this is STRICTLY Schmidt
    const [opsState, setOpsState] = useState<SchmidtOpsState>('idle');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentBubbles, setCurrentBubbles] = useState<QuickReplyOption[]>([]);
    const [draftData, setDraftData] = useState<any>({});
    const [eventDraft, setEventDraft] = useState<EventDraft>({ imageState: 'none' }); // Specific state for the interview
    const [isLoading, setIsLoading] = useState(false);
    const [venue, setVenue] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // 2. Fetch Venue Context
    const fetchVenue = useCallback(async (venueId: string) => {
        if (!venueId) return;
        try {
            const { db } = await import('../lib/firebase');
            const { doc, getDoc } = await import('firebase/firestore');
            const docRef = doc(db, 'venues', venueId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setVenue({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (err) {
            console.error("Schmidt Ops failed to load venue context:", err);
            setError("Could not load venue context. Some features may be limited.");
        }
    }, []);

    // 3. The Compliance Engine
    const validateLCBCompliance = useCallback((text: string): { valid: boolean; reason?: string } => {
        if (!text) return { valid: true };
        const lowerText = text.toLowerCase();

        // Check for "Free Alcohol" specifically (Combinations)
        const hasForbidden = LCB_FORBIDDEN_TERMS.some(term => lowerText.includes(term));
        const hasAlcohol = ALCOHOL_TERMS.some(word => lowerText.includes(word));

        // Rule: "Free" + Alcohol Context
        if (lowerText.includes('free') && hasAlcohol) {
            return {
                valid: false,
                reason: "I can't post that. Washington LCB regulations prohibit advertising 'free' alcohol. Try a specific price (e.g., '$1 Shots')."
            };
        }

        // Rule: "Unlimited" / "Bottomless"
        if (lowerText.includes('unlimited') || lowerText.includes('bottomless')) {
            return {
                valid: false,
                reason: "I can't post that. 'Unlimited' or 'Bottomless' drink offers are prohibited by LCB rules."
            };
        }

        return { valid: true };
    }, []);

    // 4. Time/Schedule Validator
    const validateSchedule = useCallback(async (timeISO: string, duration: number) => {
        const mockVenue = { partnerConfig: { tier: 'FREE', flashBountiesUsed: 0 } } as any;
        try {
            const check = await VenueOpsService.validateSlot(mockVenue, new Date(timeISO).getTime(), duration);
            return check;
        } catch (e) {
            console.warn("Validation service unreachable, proceeding with caution.");
            return { valid: true };
        }
    }, []);

    // Helper for streaming updates 
    const updateLastSchmidtMessage = useCallback((text: string) => {
        setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg && (lastMsg.role === 'model' || lastMsg.role === 'artie')) {
                lastMsg.text = text;
            }
            return newMessages;
        });
    }, []);


    // 5. The Traffic Controller (Skill Context Provider)
    const processAction = useCallback(async (action: string, rawPayload?: string, venueId?: string, requestContext?: { userId?: string; userRole?: string; hpValue?: string }) => {
        setError(null);
        const payload = rawPayload?.trim();

        if (venueId && !venue) {
            await fetchVenue(venueId);
        }

        // --- Context Implementation ---
        const addUserMessage = (text: string) => {
            // Generate ID for key props
            const id = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setMessages(prev => [...prev, { id, role: 'user', text, timestamp: Date.now() }]);
        };

        const addSchmidtResponse = (text: string, options: QuickReplyOption[] = []) => {
            const id = `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newMessage: ChatMessage = {
                id,
                role: 'artie', // Kept generic for now, or 'model'
                text: text,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, newMessage]);
            setCurrentBubbles(options);
        };

        const addSchmidtMessage = (text: string, imageUrl?: string) => {
            const id = `s-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newMessage: ChatMessage = {
                id,
                role: 'artie',
                text,
                timestamp: Date.now(),
                imageUrl
            };
            setMessages(prev => [...prev, newMessage]);
        };

        const ctx: SkillContext = {
            addUserMessage,
            addSchmidtResponse,
            addSchmidtMessage,
            updateLastSchmidtMessage,
            setIsLoading,
            setOpsState,
            currentOpsState: opsState,
            draftData,
            setDraftData,
            venue,
            processAction,
            validateLCBCompliance,
            validateSchedule
        };

        const eventCtx: EventSkillContext = {
            ...ctx,
            eventDraft,
            setEventDraft
        };

        // --- THE ROUTING TABLE (SCHMIDT / OWNER ADMIN) ---
        switch (action) {
            case 'START_SESSION':
                setOpsState('selecting_skill');
                setMessages([]);

                const welcomeMsg = "Welcome back! I'm ready to help. What's the mission?";

                const welcomeBubbles: QuickReplyOption[] = [
                    { id: '1', label: 'Flash Bounty', value: 'skill_flash_deal', icon: '⚡' },
                    { id: '2', label: 'Add Event', value: 'skill_add_event', icon: '📅' },
                    { id: '3', label: 'Social Post', value: 'skill_social_post', icon: '📱' },
                    { id: '4', label: 'Draft Email', value: 'skill_email_draft', icon: '✉️' },
                    { id: '5', label: 'Calendar Post', value: 'skill_calendar_post', icon: '🗓️' },
                    { id: '6', label: 'Web Content', value: 'skill_website_content', icon: '🌐' },
                    { id: '7', label: 'Gen Image', value: 'skill_generate_image', icon: '🎨' }
                ];

                addSchmidtResponse(welcomeMsg, welcomeBubbles);
                break;

            // --- SCHMIDT: Flash Bounties ---
            case 'skill_flash_deal':
                SchmidtBounty.handleFlashBountyInit(ctx);
                break;
            case 'bounty_food':
            case 'bounty_drink':
            case 'bounty_time':
                SchmidtBounty.handleTypeSelection(action, ctx);
                break;
            case 'method_ideation':
                SchmidtBounty.handleMethodIdeation(ctx);
                break;
            case 'accept_ideation_proposal':
                await SchmidtBounty.handleAcceptIdeationProposal(ctx);
                break;
            case 'method_manual_input':
                SchmidtBounty.handleMethodManualInput(ctx);
                break;
            case 'SUBMIT_DEAL_TEXT':
                await SchmidtBounty.handleSubmitBountyText(payload, ctx);
                break;

            // --- SCHMIDT: Image Generation ---
            case 'skill_generate_image':
                SchmidtImages.handleImageGenInit(ctx);
                break;
            case 'SUBMIT_IMAGE_PURPOSE':
            case 'purpose_social':
            case 'purpose_web':
            case 'purpose_print':
            case 'purpose_exclusive':
                {
                    const labelMap: any = { 'purpose_social': 'Social Media', 'purpose_web': 'Website', 'purpose_print': 'Print Flyer', 'purpose_exclusive': 'Member Only' };
                    SchmidtImages.handleSubmitPurpose(labelMap[action] || payload, ctx);
                }
                break;
            case 'SUBMIT_IMAGE_GOAL':
            case 'goal_event':
            case 'goal_menu':
            case 'goal_vibe':
            case 'goal_hiring':
                {
                    const labelMap: any = { 'goal_event': 'Promote Event', 'goal_menu': 'Showcase Menu', 'goal_vibe': 'Daily Vibe', 'goal_hiring': 'Hiring/Team' };
                    SchmidtImages.handleSubmitGoal(labelMap[action] || payload, ctx);
                }
                break;
            case 'SUBMIT_IMAGE_EVENT':
                SchmidtImages.handleSubmitEventDetails(payload, ctx);
                break;
            case 'SUBMIT_IMAGE_AUDIENCE':
                SchmidtImages.handleSubmitAudience(payload, ctx);
                break;
            case 'SUBMIT_IMAGE_SPECIALS':
            case 'no_specials':
                SchmidtImages.handleSubmitSpecials(action === 'no_specials' ? 'no_specials' : payload, ctx);
                break;
            case 'SUBMIT_IMAGE_CONTEXT':
                await SchmidtImages.handleSubmitContext(payload, ctx);
                break;
            case 'COMPLETE_IMAGE_GEN':
                SchmidtImages.handlePostImageGen(ctx);
                break;

            // --- SCHMIDT: Content & Copy ---
            case 'skill_social_post':
                SchmidtContent.handleSocialPostInit(ctx);
                break;
            case 'SUBMIT_SOCIAL_POST_TEXT':
                await SchmidtContent.handleSubmitSocialText(payload, ctx);
                break;
            case 'skill_email_draft':
                SchmidtContent.handleEmailDraftInit(ctx);
                break;
            case 'SUBMIT_EMAIL_TEXT':
                await SchmidtContent.handleSubmitEmailText(payload, ctx);
                break;
            case 'skill_ad_copy':
                SchmidtContent.handleAdCopyRequest(ctx);
                break;
            case 'SUBMIT_CALENDAR_TEXT':
                await SchmidtContent.handleSubmitCalendarText(payload, ctx);
                break;
            case 'SUBMIT_WEB_TEXT':
                await SchmidtContent.handleSubmitWebText(payload, ctx);
                break;
            case 'generating_creative_copy':
            case 'regen_hype':
            case 'regen_chill':
            case 'regen_funny':
                await SchmidtContent.handleGeneratingCreativeCopy(payload, eventCtx);
                break;

            // --- SCHMIDT: Events ---
            case 'skill_add_event':
                SchmidtEvents.handleAddEventInit(eventCtx);
                break;
            case 'event_has_flyer':
                SchmidtEvents.handleHasFlyer(eventCtx);
                break;
            case 'event_no_flyer':
                SchmidtEvents.handleNoFlyer(eventCtx);
                break;
            case 'event_gen_flyer':
                await SchmidtEvents.handleGenFlyerRequest(eventCtx);
                break;
            case 'event_text_only':
                SchmidtEvents.handleTextOnlyEvent(eventCtx);
                break;
            case 'SUBMIT_EVENT_TEXT':
                await SchmidtEvents.handleSubmitEventText(payload, eventCtx);
                break;
            case 'edit_event':
                SchmidtEvents.handleEditEvent(eventCtx);
                break;
            case 'copy_approved':
                SchmidtEvents.handleCopyApproved(eventCtx);
                break;

            // --- SCHMIDT: CMS Operations ---
            case 'skill_calendar_post':
                SchmidtContent.handleCalendarPostInit(ctx);
                break;
            case 'skill_website_content':
                SchmidtContent.handleWebsiteContentInit(ctx);
                break;

            // --- COMMON ENGINE ---
            case 'confirm_post':
                addUserMessage('Post It');
                await SchmidtExecution.handleConfirmAction(eventCtx);
                break;

            case 'UPLOAD_FILE':
                await SchmidtExtraction.handleUploadFile(payload, eventCtx);
                break;

            case 'completed':
                setOpsState('selecting_skill');
                setDraftData({});
                setEventDraft({ imageState: 'none' });
                addSchmidtResponse("Mission accomplished. What's next?", [
                    { id: '1', label: 'Flash Bounty', value: 'skill_flash_deal', icon: '⚡' },
                    { id: '2', label: 'Add Event', value: 'skill_add_event', icon: '📅' },
                    { id: '3', label: 'Social Post', value: 'skill_social_post', icon: '📱' },
                    { id: '7', label: 'Gen Image', value: 'skill_generate_image', icon: '🎨' }
                ]);
                break;

            case 'cancel':
                setOpsState('selecting_skill');
                setDraftData({});
                setEventDraft({ imageState: 'none' });
                setCurrentBubbles([
                    { id: '1', label: 'Flash Bounty', value: 'skill_flash_deal', icon: '⚡' },
                    { id: '2', label: 'Add Event', value: 'skill_add_event', icon: '📅' },
                    { id: '3', label: 'Social Post', value: 'skill_social_post', icon: '📱' },
                    { id: '4', label: 'Draft Email', value: 'skill_email_draft', icon: '✉️' },
                    { id: '5', label: 'Calendar Post', value: 'skill_calendar_post', icon: '🗓️' },
                    { id: '6', label: 'Web Content', value: 'skill_website_content', icon: '🌐' },
                    { id: '7', label: 'Gen Image', value: 'skill_generate_image', icon: '🎨' }
                ]);
                addSchmidtResponse("Cancelled. What else?");
                break;

            default:
                console.warn("Unknown Schmidt Action:", action);
                addSchmidtResponse(`I'm learning a new trick called ${action}, but I haven't mastered it yet.`);
                setOpsState('selecting_skill');
        }
    }, [draftData, eventDraft, opsState, validateLCBCompliance, validateSchedule, venue, fetchVenue]);

    const addSchmidtMessage = useCallback((text: string, imageUrl?: string) => {
        const id = `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: ChatMessage = {
            id,
            role: 'artie',
            text,
            timestamp: Date.now(),
            imageUrl
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);

    const resetOps = useCallback(() => {
        setMessages([]);
        setOpsState('idle');
        setDraftData({});
        setEventDraft({ imageState: 'none' });
        setCurrentBubbles([]); // CLEAR BUBBLES

        // Final sanity re-init
        const id = `schmidt-init-${Date.now()}`;
        setMessages([{
            id,
            role: 'artie',
            text: `Schmidt here. System reset complete. Ready for new orders.`,
            timestamp: Date.now()
        }]);

        // Trigger start session to repopulate bubbles
        processAction('START_SESSION');
    }, [processAction]);

    return {
        opsState,
        setOpsState, // Exposed for external control (e.g. Edit button)
        messages,
        currentBubbles,
        processAction,
        draftData,
        isLoading,
        venue,
        error,
        addSchmidtMessage,
        updateLastSchmidtMessage,
        resetOps
    };
};
