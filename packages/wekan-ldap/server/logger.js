const isLogEnabled = (process.env.LDAP_LOG_ENABLED === 'true');

function isSensitiveKey(key) {
    return /pass(word)?|digest|secret|token|api[-_]?key|authorization|cookie|session/i.test(String(key));
}

function redactSensitiveString(value) {
    return String(value).replace(
        /\b(pass(word)?|digest|secret|token|api[-_]?key|authorization|cookie|session)\b\s*([:=])\s*([^\s,;]+)/gi,
        (match, key, _pw, separator) => `${key}${separator}[REDACTED]`
    );
}

function sanitizeForLogging(value) {
    if (Array.isArray(value)) {
        return value.map(sanitizeForLogging);
    }

    if (typeof value === 'string') {
        return redactSensitiveString(value);
    }

    if (value && typeof value === 'object') {
        const sanitized = {};
        Object.keys(value).forEach((key) => {
            if (isSensitiveKey(key)) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = sanitizeForLogging(value[key]);
            }
        });
        return sanitized;
    }

    return value == null ? String(value) : redactSensitiveString(value);
}

function log (level, ...args) {
    if (isLogEnabled) {
        const safeMessage = args
            .map((arg) => {
                const sanitized = sanitizeForLogging(arg);
                return (sanitized && typeof sanitized === 'object')
                    ? JSON.stringify(sanitized, null, 2)
                    : sanitized;
            })
            .join(' ');
        console.log(`[${level}] ${safeMessage}`);
    }
}

function log_debug (...args) { log('DEBUG', ...args); }
function log_info (...args) { log('INFO', ...args); }
function log_warn (...args) { log('WARN', ...args); }
function log_error (...args) { log('ERROR', ...args); }

export { log, log_debug, log_info, log_warn, log_error };
