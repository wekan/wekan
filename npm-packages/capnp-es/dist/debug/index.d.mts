import { d as Message, S as Struct } from '../shared/capnp-es.CnTZV_-5.mjs';

/**
 * Converts a Cap'n Proto message to a human-readable string representation.
 *
 * This function uses the Cap'n Proto command-line tool to convert a binary message
 * to either text or JSON format. It is slow and should be used for debug only.
 *
 * @param message The Cap'n Proto message to convert
 * @param struct The struct type or display name of the message
 * @param capnpPath Path to the Cap'n Proto executable (defaults to "capnp")
 * @param format Output format, either "text" or "json" (defaults to "text")
 * @param schemaPath Path to the Cap'n Proto schema file. Absolute or relative to cwd.
 *
 * @returns A promise that resolves to the string representation of the message
 */
declare function messageToString(message: Message, struct: typeof Struct | string, { capnpPath, format, schemaPath, }?: {
    capnpPath?: string;
    format?: "capnp" | "json";
    schemaPath?: string;
}): Promise<string>;

export { messageToString };
