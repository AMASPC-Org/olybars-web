# Bead: B009 - AI Brain Expansion (Gemini Upgrade)

> **Status**: Claimed
> **Agent**: V3R1
> **Priority**: High
> **Type**: AI / Prompt Engineering
> **Dependencies**: B008
> **Estimated Effort**: High

## Context
The "Intelligence" of the OlyBars ingestor lies within the `GeminiService`. Currently, the prompts are rigid and don't account for specialized data like tap lists (ABV, IBU) or the owner's specific "Rules of Extraction." To fulfill the "Rules-Based Operating System" vision, we must upgrade the AI's logic to be dynamic and rule-aware.

## Reasoning & Justification
- **Contextual Precision:** A generic menu extractor might miss the "Draft List" if it's looking for "Menu Items." A specialized `DRINKS` mode solves this.
- **Owner Sovereignty:** By injecting `extractionNotes` into the system instruction, we move from a "Black Box" AI to a "Controllable Agent." This is a key differentiator for OlyBars.
- **FinOps Optimization:** Specialized prompts are shorter and more efficient than one massive "God Prompt," reducing token usage while increasing accuracy.

## Goals
1.  **Specialized Extraction Modes:** Implement dedicated prompts for `CALENDAR`, `DRINKS`, and `WEBSITE`.
2.  **Instruction Injection:** Programmatically prepend `extractionNotes` to the extraction prompts.
3.  **Beverage-Aware Logic:** Teach the AI to value specific beverage metadata (Style, ABV, IBU).
4.  **Intelligence Consolidation:** Implement an "Anti-Bloat" rule where the AI is provided with the existing `ai_draft_profile` data and tasked with deduplicating new findings against it before outputting.

## Implementation Details

### 1. Beverage Mode (DRINKS)
- [ ] Create a specialized mode in `analyzeScrapedContent` for `DRINKS`.
- [ ] Prompt the AI to categorize by "Draft" vs "Can/Bottle."
- [ ] Request metadata: `style`, `abv`, `price`, `brewery`.

### 2. Rule Injection
- [ ] Update `analyzeScrapedContent` to accept `rules?: string`.
33. - [ ] Inject as block:
    ```
    === OWNER RULES OF ENGAGEMENT ===
    ${rules}
    =================================
    ```

### 3. Calendar Logic (CALENDAR)
- [ ] Create a specialized mode for `CALENDAR` text.
- [ ] Instruct the AI to look for recurring patterns (e.g., "Every 2nd Tuesday") and expand them for the next 30 days.

### 4. Intelligence Consolidation (The "Anti-Bloat" Shield)
- [ ] Update all JSON schemas to include an `isNew` flag or similar.
- [ ] Pass `existing_highlights: string[]` to the Gemini prompt.
- [ ] Prompt: "Compare findings against Existing Highlights. Only return NEW items or items with updated pricing/info."

## Acceptance Criteria
- [ ] Mock extraction for `DRINKS` returns structured beer data.
- [ ] AI output respects an injection like "Ignore the food menu."
- [ ] ISO date parsing remains 100% accurate for relative dates.
