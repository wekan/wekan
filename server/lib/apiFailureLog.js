const { foldEventFireAndForget } = require('/server/lib/eventLogFold');

// Only the router's registered pattern belongs here. URLs, params, headers,
// messages, stacks and nested error objects can all contain credentials.
function apiFailureEvent(req, error) {
  const methods = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const requestedMethod = req?.method;
  const method = methods.includes(requestedMethod) ? requestedMethod : 'OTHER';
  const route = req?.route?.path;
  const pattern = typeof route === 'string' && route.length <= 500 &&
    !/[\r\n?#]/.test(route) ? route : '(route unavailable)';
  const names = ['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'Meteor.Error'];
  let kind = 'Error';
  try {
    const name = error?.name;
    if (names.includes(name)) kind = name;
  } catch (_) { /* An exception may itself have throwing accessors. */ }
  return { stream: 'api', source: 'apiMiddleware', action: 'failed', severity: 'medium',
    api: `${method} ${pattern} (failed)`, kind,
    detail: 'Unhandled route failure. Request values and exception text are omitted.' };
}

function recordApiFailure(req, error) {
  try { foldEventFireAndForget(apiFailureEvent(req, error), 'apiFailureLog'); }
  catch (_) { /* Even an unreadable exception or failed logger must not break the response. */ }
}

module.exports = { apiFailureEvent, recordApiFailure };
