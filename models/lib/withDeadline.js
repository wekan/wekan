// Bound a promise so a hung or stalled operation can never block forever. Resolves
// with the promise's value if it settles within `ms`; otherwise rejects with a timeout
// error (from `onTimeout()` if given, else a generic Error). The underlying promise is
// not cancelled — JavaScript cannot cancel a promise — but the caller is freed, so a
// method/handler returns an error to the client instead of spinning indefinitely.
//
// Pure and dependency-free so it can be unit-tested and reused anywhere a long
// operation needs a hard deadline (imports, migrations, external fetches, …).
//
// Usage:
//   await withDeadline(doWork(), 120000, () => new Meteor.Error('op-timeout'));

function withDeadline(promise, ms, onTimeout) {
  // A non-positive / invalid deadline means "no deadline": just await the promise.
  if (!(ms > 0)) {
    return Promise.resolve(promise);
  }

  return new Promise((resolve, reject) => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      const err =
        typeof onTimeout === 'function' ? onTimeout() : new Error('operation-timeout');
      reject(err);
    }, ms);

    // Do not keep the process alive just for this timer (Node only; harmless elsewhere).
    if (timer && typeof timer.unref === 'function') {
      timer.unref();
    }

    Promise.resolve(promise).then(
      value => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export { withDeadline };
