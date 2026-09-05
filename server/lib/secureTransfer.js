import { sanitizeTransferValue } from '/models/lib/importExportBoundary';
import { sanitizeInput } from '/server/lib/inputSanitizer';

// Server wrapper around the pure structural boundary. This is deliberately the
// only place that couples transfer validation to DOMPurify and Admin Problems,
// so every adapter records blocked and sanitized attempts consistently.
export function secureTransfer(value, context = {}) {
  try {
    const result = sanitizeTransferValue(value, {
      direction: context.direction || 'import',
      sanitizeHtml: sanitizeInput,
      maxDepth: context.maxDepth,
      maxNodes: context.maxNodes,
      maxArray: context.maxArray,
      maxString: context.maxString,
      maxBinaryString: context.maxBinaryString,
    });
    if (result.warnings.length) {
      require('/server/lib/securityLog').record({
        category: 'Import/export validation',
        bleed: 'ImportExportSanitization',
        severity: 'warning',
        action: 'sanitized',
        source: context.source || `${context.direction || 'import'}:unknown`,
        userId: context.userId,
        username: context.username,
        ip: context.ip,
        detail: `${result.warnings.length} unsafe value(s): ${result.warnings.slice(0, 5).map(w => `${w.path} ${w.reason}`).join('; ')}`,
      });
    }
    return result.value;
  } catch (error) {
    require('/server/lib/securityLog').record({
      category: 'Import/export validation',
      bleed: 'ImportExportValidation',
      severity: 'high',
      action: 'blocked',
      source: context.source || `${context.direction || 'import'}:unknown`,
      userId: context.userId,
      username: context.username,
      ip: context.ip,
      detail: error && error.message,
    });
    throw error;
  }
}

export default secureTransfer;
