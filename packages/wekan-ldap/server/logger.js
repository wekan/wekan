const isLogEnabled = (process.env.LDAP_LOG_ENABLED === 'true');


function log (level, message, data) { 
    if (isLogEnabled) {
        console.log(`[${level}] ${message} ${ data ? JSON.stringify(data, null, 2) : '' }`);
    }
}

function log_debug (...args) { log('DEBUG', ...args); }
function log_info (...args) { log('INFO', ...args); }
function log_warn (...args) { log('WARN', ...args); }
function log_error (...args) { log('ERROR', ...args); }

export { log, log_debug, log_info, log_warn, log_error };
