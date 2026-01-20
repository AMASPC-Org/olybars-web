import { BrandDNA, AppEvent } from '../types/shared_types';

// Define a simple interface for the specs
interface ImageSpec {
  platform: string;
  type: string;
  aspect_ratio: string; // e.g. "9:16"
}

interface PromptInputs {
  event: Partial<AppEvent> & { title: string; type: string; description?: string };
  brand: BrandDNA;
  spec: ImageSpec;
}

/**
 * Bridges abstract Brand DNA and concrete Event details into a highly engineered image prompt.
 */
export function buildImagePrompt({ event, brand, spec }: PromptInputs): string {
  // 1. THE CONTEXT (Who and What)
  const subjectLine = `
    Subject: A promotional social media image for a "${event.type}" event named "${event.title}".
    Context: ${event.description || 'A lively social gathering.'}
    Venue Vibe: ${brand.style_guide.aesthetic}.
  `;

  // 2. THE VISUAL STYLE (The "Look")
  const styleBlock = `
    Art Style: ${brand.style_guide.aesthetic}.
    Lighting: ${brand.style_guide.lighting_mood}.
    Key Textures: ${brand.style_guide.texture_keywords.join(', ')}.
    Color Palette: Primary ${brand.palette.primary}, Secondary ${brand.palette.secondary}, Accent ${brand.palette.accent}.
    Human Presence: ${brand.generation_rules.human_presence} scene.
  `;

  // 3. THE COMPOSITION (Technical Fit)
  let composition = '';
  if (spec.aspect_ratio === '9:16') {
    composition = "Composition: Vertical framing. Keep the top 20% and bottom 20% clear of busy details for UI overlays (Safe Zones). Focus action in the vertical center.";
  } else if (spec.aspect_ratio === '1.91:1') {
    composition = "Composition: Wide cinematic shot. Balance elements horizontally. Leave negative space on one side for potential text overlay.";
  } else if (spec.aspect_ratio === '4:5') {
    composition = "Composition: Portrait framing optimized for mobile feeds. Central focus.";
  } else {
    composition = "Composition: Centralized square composition. Balanced for a grid view.";
  }

  // 4. THE GUARDRAILS (What NOT to do)
  const constraints = `
    Negative Constraints: ${brand.generation_rules.negative_prompt}, blur, distortion, watermark, low resolution, text overlay (do not add text to the image), bad anatomy.
    Logo Placement Preference: Leave negative space in the ${brand.generation_rules.logo_placement} for a logo overlay.
  `;

  // 5. ASSEMBLE
  return `
    Role: You are an expert social media designer.
    
    ${subjectLine}
    
    ${styleBlock}
    
    ${composition}
    
    ${constraints}
    
    Instruction: Create a high-fidelity, photorealistic (unless specified otherwise in Art Style) image. 
    Do NOT generate any text inside the image itself.
  `.trim();
}
