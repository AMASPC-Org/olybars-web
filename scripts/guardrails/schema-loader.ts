
import { z } from 'zod';
import { ConfigSchema as ServerSchema } from '../../server/src/appConfig/schema';
import * as FunctionsConfigModule from '../../functions/src/config/schema';

// Handle CJS/ESM interop for Functions Schema
const FunctionsSchema = (FunctionsConfigModule as any).ConfigSchema || (FunctionsConfigModule as any).default?.ConfigSchema || FunctionsConfigModule;

/**
 * Validates that an object is likely a Zod schema and returns its shape.
 * Handles Zod v3 and v4 differences by just looking for the 'shape' property.
 */
function getShape(schema: any) {
    if (schema && typeof schema === 'object' && schema.shape) {
        return schema.shape;
    }
    return {};
}

const serverShape = getShape(ServerSchema);
const functionsShape = getShape(FunctionsSchema);

// Combine all keys from both schemas
const allKeys = new Set([
    ...Object.keys(serverShape),
    ...Object.keys(functionsShape)
]);

// Classify keys
export const RequiredKeys = Array.from(allKeys).filter(key => {
    // We assume all keys in the schema are required unless explicitly optional.
    // However, without Zod compatibility, checking .isOptional() is risky.
    // For a strict guardrail, we assume if it's in the schema, it SHOULD be in the env.
    // We can allow exceptions for known optionals.

    // Check Server Schema for optionality if possible (best effort)
    const def = serverShape[key] || functionsShape[key];

    // In Zod v3/v4, internal structure differs, but 'isOptional' method usually exists on the definition.
    // We try/catch it.
    try {
        if (typeof def.isOptional === 'function' && def.isOptional()) return false;
        // ZodDefault (v3) means it has a default, so technically optional to provide.
        if (def._def && def._def.typeName === 'ZodDefault') return false;
        if (def._def && def._def.typeName === 'ZodOptional') return false;
    } catch (e) {
        // Ignore check failure
    }
    return true;
});

export const OptionalKeys = Array.from(allKeys).filter(key => !RequiredKeys.includes(key));
export const FrontendKeys = Array.from(allKeys).filter(key => key.startsWith('VITE_'));

// We export a simple Zod schema RECONSTRUCTED from the keys, assuming string for all.
// This allows basic "It's a string" validation without mixing versions.
const shapeObject: any = {};
Array.from(allKeys).forEach(key => {
    shapeObject[key] = z.string().optional(); // We validate presence manually, type is loose.
});

export const UnifiedSchema = z.object(shapeObject);
