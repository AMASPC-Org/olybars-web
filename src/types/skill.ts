import { QuickReplyOption } from '../components/artie/QuickReplyChips';
import { SchmidtOpsState } from '../features/Schmidt/types'; // Moved types to feature to avoid circular dep if needed, or just keep as is for now but add ChatMessage
import { ChatMessage } from './chat';

/**
 * Standard context provided to every skill module to allow interaction
 * with the main useSchmidtOps state.
 */
export interface SkillContext {
    // UI/Messaging
    addUserMessage: (text: string) => void;
    addSchmidtResponse: (text: string, options?: QuickReplyOption[]) => void;
    addSchmidtMessage: (text: string, imageUrl?: string) => void;
    updateLastSchmidtMessage: (text: string) => void; // Support for streaming updates
    setIsLoading: (loading: boolean) => void;

    // State Management
    setOpsState: (state: SchmidtOpsState) => void;
    currentOpsState: SchmidtOpsState;

    // Data Management
    draftData: any;
    setDraftData: (data: any | ((prev: any) => any)) => void;

    // Venue Context
    venue: any;

    // Core Logic Relay (to allow skills to trigger other actions/skills)
    processAction: (action: string, payload?: string, venueId?: string, context?: { userId?: string; userRole?: string; hpValue?: string }) => Promise<void>;

    // Validation Helpers
    validateLCBCompliance?: (text: string) => { valid: boolean; reason?: string };
    validateSchedule?: (timeISO: string, duration: number) => Promise<{ valid: boolean; reason?: string }>;
}

/**
 * Specialized context for Event operations which use the eventDraft state.
 */
export interface EventSkillContext extends SkillContext {
    eventDraft: any;
    setEventDraft: (draft: any | ((prev: any) => any)) => void;
}
