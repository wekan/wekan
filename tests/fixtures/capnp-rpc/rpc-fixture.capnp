@0xb18256ee3b7b0da1;

# Interfaces for tests/sandstormCapnpRpc.test.cjs, which runs the
# @wekanteam/capnp-es RPC client against the reference C++ Cap'n Proto RPC
# implementation (mock-bridge.c++). Each method makes the C++ side send one of
# the messages the WeKan fork added support for.

interface Counter {
  next @0 () -> (n :UInt32);
  # Returns how many calls this counter has received, including this one, so
  # the caller can check that calls were delivered in the order it made them.
}

interface Fixture {
  echoLater @0 (cap :Counter) -> (cap :Counter);
  # Returns a PROMISE that resolves, after a delay, to `cap` - a capability the
  # caller itself hosts. Calls the caller made on the promise travel to the C++
  # side and back; the Resolve that follows points at the caller's own export,
  # so calls made after it need a Disembargo to keep their order.

  serverCounterLater @1 () -> (cap :Counter);
  # Returns a promise that resolves, after a delay, to a Counter hosted by the
  # C++ side: senderPromise, then Resolve to senderHosted.

  brokenLater @2 () -> (cap :Counter);
  # Returns a promise that resolves, after a delay, to an exception.

  liveServerCounters @3 () -> (n :UInt32);
  # How many Counter objects the C++ side still holds. A Counter is destroyed
  # when its last reference is released, so this shows Release arriving.
}
