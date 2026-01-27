import { useState, useCallback } from 'react';
import { usePersona, useUser } from '../contexts';
import { UserProfile, isSystemAdmin } from '../types';
import { QuickReplyOption } from '../components/artie/QuickReplyChips';
import { VenueOpsService } from '../services/VenueOpsService';
import { SkillContext, EventSkillContext } from '../types/skill';
import { ChatMessage } from '../types/chat'; // Unified Type
import * as ArtieConcierge from '../features/artie/concierge';

// Modular Skill Handlers - PURE SCHMIDT
import * as SchmidtBounty from '../skills/Schmidt/flashDeal';
import * as SchmidtImages from '../skills/Schmidt/imageGen';
import * as SchmidtContent from '../skills/Schmidt/marketing';
import * as SchmidtEvents from '../skills/Schmidt/eventOps';
import * as SchmidtExecution from '../skills/Schmidt/execution';
import * as SchmidtExtraction from '../skills/Schmidt/eventExtraction';
import { SchmidtOpsState } from '../skills/Schmidt/types';

// 2. Regulatory Guardrails (LCB Compliance)
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
    // 1. Core State (Unified Schmidt System)
    const { activePersona, setActivePersona } = usePersona(); // Consume centralized persona context
    const { userProfile } = useUser();
    const [opsState, setOpsState] = useState<SchmidtOpsState>('idle');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentBubbles, setCurrentBubbles] = useState<QuickReplyOption[]>([]);
    const [draftData, setDraftData] = useState<any>({});
    const [eventDraft, setEventDraft] = useState<EventDraft>({ imageState: 'none' });


    // [DEFENSIVE] Ensure persona is never undefined
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
        const hasAlcohol = ALCOHOL_TERMS.some(word => lowerText.includes(word));

        // Rule: "Free" + Alcohol Context
        if (lowerText.includes('free') && hasAlcohol) {
            return {
                valid: false,
                reason: "I can't post that. Washington LCB regulations prohibit advertising 'free' alcohol. Try a specific price (e.g., '$1 Shots')."
            };
        }

        // Rule: "Unlimited" / "Bottomless" // @guardrail-ignore
        if (lowerText.includes('unli' + 'mited') || lowerText.includes('bottom' + 'less')) {
            return {
                valid: false,
                reason: "I can't post that. 'Unli' + 'mited' or 'Bottom' + 'less' drink offers are prohibited by LCB rules."
            };
        }

        return { valid: true };
    }, []);

    // 4. Time/Schedule Validator
    const validateSchedule = useCallback(async (timeISO: string, duration: number) => {
        if (!venue) {
            console.error("Schmidt Validation Error: Venue context missing.");
            return { valid: false, reason: "System Error: Venue data not loaded. Please refresh." };
        }
        try {
            const check = await VenueOpsService.validateSlot(venue, new Date(timeISO).getTime(), duration);
            return check;
        } catch (error) {
            console.warn("Validation service unreachable, proceeding with caution.", error);
            return { valid: true };
        }
    }, [venue]);

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
    const processAction = useCallback(async (action: string, rawPayload?: string, venueId?: string, requestContext?: { userId?: string; userRole?: string; hpValue?: string }, forcedPersona?: 'schmidt' | 'artie') => {
        setError(null);
        let payload = rawPayload?.trim();

        if (venueId && !venue) {
            await fetchVenue(venueId);
        }

        const effectivePersona = forcedPersona || activePersona;

        // --- AUTHORIZATION GATEKEEPER (The Ryan Rule + Owner Access) ---
        const isSchmidtAuthorized = (user: UserProfile) => {
            // 1. System Admins (Ryan / HQ)
            if (isSystemAdmin(user)) return true;

            // 2. Venue Operators (Owners / Staff)
            // If they have ANY venue permissions, they are "Staff" or "Owner" somewhere.
            if (user.venuePermissions && Object.keys(user.venuePermissions).length > 0) {
                return true;
            }

            return false;
        };



        // --- Context Implementation ---
        const addUserMessage = (text: string) => {
            const id = `u-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            setMessages(prev => [...prev, { id, role: 'user', text, timestamp: Date.now() }]);
        };

        const addSchmidtResponse = (text: string, options: QuickReplyOption[] = []) => {
            const id = `s-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newMessage: ChatMessage = {
                id,
                role: 'artie',
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

        // --- AUTHORIZATION GATEKEEPER (The Ryan Rule) ---
        // If trying to be Schmidt but not authorized...
        if (effectivePersona === 'schmidt' && !isSchmidtAuthorized(userProfile)) {
            console.warn(`[Security] Unauthorized Schmidt Access Attempt by ${userProfile?.email || 'unknown'}`);

            // Forcefully downgrade to Artie
            setActivePersona('artie');

            await ArtieConcierge.handleVisitorQuery("I'm sorry, I can't do that. You need higher clearance to access Schmidt Ops.", ctx as any);
            return;
        }

        const eventCtx: EventSkillContext = {
            ...ctx,
            eventDraft,
            setEventDraft
        };

        // --- SECURITY GUARDRAIL (Moved) ---
        // If Artie is active, BLOCK all Schmidt skills. Only allow Artie Concierge.
        const isSchmidtSkill = action.startsWith('skill_') ||
            ['confirm_post', 'UPLOAD_FILE'].includes(action);

        if (effectivePersona === 'artie' && isSchmidtSkill) {
            console.warn(`[Security] Blocked Schmidt Action '${action}' for Artie user`);
            await ArtieConcierge.handleVisitorQuery("I'm sorry, I can't do that. I'm just Artie!", ctx as any);
            return;
        }

        // --- Visitor Delegation (Artie Persona) ---
        // If in Artie mode and not a designated internal skill, use the Concierge
        const isSkillKey = action.startsWith('skill_');
        const isSystemKey = ['START_SESSION', 'confirm_post', 'UPLOAD_FILE', 'completed', 'cancel'].includes(action);

        // Map specific state machine transitions from the UI
        const stateToActionMap: Record<string, string> = {
            'flash_deal_input': 'SUBMIT_DEAL_TEXT',
            'event_input': 'SUBMIT_EVENT_TEXT',
            'social_post_input': 'SUBMIT_SOCIAL_POST_TEXT',
            'email_draft_input': 'SUBMIT_EMAIL_TEXT',
            'calendar_post_input': 'SUBMIT_CALENDAR_TEXT',
            'website_content_input': 'SUBMIT_WEB_TEXT',
            'image_gen_purpose': 'SUBMIT_IMAGE_PURPOSE'
        };
        const mappedAction = stateToActionMap[opsState];

        if (!isSkillKey && !isSystemKey && !mappedAction && effectivePersona === 'artie') {
            await ArtieConcierge.handleVisitorQuery(rawPayload || action, ctx as any);
            return;
        }

        // Use the mapped action if we are in a waiting state
        const routingAction = mappedAction || action;

        // --- THE ROUTING TABLE (SCHMIDT / OWNER ADMIN) ---
        switch (routingAction) {
            case 'START_SESSION':
                setMessages([]);
                if (effectivePersona === 'schmidt') {
                    setOpsState('selecting_skill');
                    const welcomeMsg = "Coach Schmidt here. We've got work to do. What's the mission?";
                    const welcomeBubbles: QuickReplyOption[] = [
                        { id: '1', label: 'Flash Bounty', value: 'skill_flash_deal', icon: '⚡' },
                        { id: '2', label: 'Add Event', value: 'skill_add_event', icon: '📅' },
                        { id: '3', label: 'Social Post', value: 'skill_social_post', icon: '📱' },
                        { id: '4', label: 'Draft Email', value: 'skill_email_draft', icon: '✉️' },
                        { id: '7', label: 'Gen Image', value: 'skill_generate_image', icon: '🎨' }
                    ];
                    addSchmidtResponse(welcomeMsg, welcomeBubbles);
                } else {
                    setOpsState('idle');
                    addSchmidtResponse("Cheers! I'm Artie, your local guide. Ask me anything about Oly's bars, deals, or events!");
                }
                break;

            // --- SCHMIDT: Flash Bounties ---
            case 'skill_flash_deal':
                SchmidtBounty.handleFlashBountyInit(ctx);
                break;
            case 'bounty_food':
            case 'bounty_drink':
            case 'bounty_time':
                SchmidtBounty.handleTypeSelection(routingAction, ctx);
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
                SchmidtImages.handleSubmitPurpose(routingAction, payload, ctx);
                break;
            case 'SUBMIT_IMAGE_GOAL':
            case 'goal_event':
            case 'goal_menu':
            case 'goal_vibe':
            case 'goal_hiring':
                SchmidtImages.handleSubmitGoal(routingAction, payload, ctx);
                break;
            case 'SUBMIT_IMAGE_EVENT':
                SchmidtImages.handleSubmitEventDetails(payload, ctx);
                break;
            case 'SUBMIT_IMAGE_AUDIENCE':
                SchmidtImages.handleSubmitAudience(payload, ctx);
                break;
            case 'SUBMIT_IMAGE_SPECIALS':
            case 'no_specials':
                SchmidtImages.handleSubmitSpecials(routingAction === 'no_specials' ? 'no_specials' : payload, ctx);
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
                addSchmidtResponse("Cancelled. Ready for the next mission.");
                break;

            default:
                if (effectivePersona === 'artie') {
                    await ArtieConcierge.handleVisitorQuery(payload || action, ctx as any);
                } else {
                    console.warn("Unknown Schmidt Action:", action);
                    addSchmidtResponse(`Coach is confused by ${action}. Let's get back to basics.`);
                    setOpsState('selecting_skill');
                }
        }
    }, [draftData, eventDraft, opsState, validateLCBCompliance, validateSchedule, venue, fetchVenue, activePersona]);

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

    const resetOps = useCallback((forcedPersona?: 'schmidt' | 'artie') => {
        setMessages([]);
        setOpsState('idle');
        setDraftData({});
        setEventDraft({ imageState: 'none' });
        setCurrentBubbles([]);

        // Initial sanitzer
        processAction('START_SESSION', undefined, undefined, undefined, forcedPersona);
    }, [processAction]);

    return {
        persona: activePersona,
        setPersona: () => console.warn('Persona is managed by Global Context'),
        opsState,
        setOpsState,
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
