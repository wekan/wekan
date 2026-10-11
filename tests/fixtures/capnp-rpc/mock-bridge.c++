// Reference peer for tests/sandstormCapnpRpc.test.cjs.
//
// WeKan talks to sandstorm-http-bridge over Cap'n Proto RPC on
// /tmp/sandstorm-api through @wekanteam/capnp-es, a pure-JavaScript
// implementation. A real grain cannot be started in the test environment, so
// this program stands in for the bridge using the SAME C++ RPC implementation
// and the SAME Sandstorm schemas that sandstorm-http-bridge is built from. What
// passes against it is what the C++ side of a grain will accept and send.
//
//   mock-bridge <socket-path> bridge    SandstormHttpBridge, as WeKan uses it
//   mock-bridge <socket-path> fixture   rpc-fixture.capnp: Resolve, Release,
//                                       Disembargo and broken promises
//
// Everything worth asserting is printed to stdout as one JSON object per line,
// flushed at once, so the test can follow it while it runs.

#include <capnp/ez-rpc.h>
#include <capnp/capability.h>
#include <kj/async.h>
#include <kj/async-io.h>
#include <kj/timer.h>
#include <kj/debug.h>
#include <kj/encoding.h>
#include <kj/string.h>
#include <iostream>
#include <string>
#include <sandstorm/sandstorm-http-bridge.capnp.h>
#include <sandstorm/grain.capnp.h>
#include <sandstorm/identity.capnp.h>
#include <sandstorm/activity.capnp.h>
#include <sandstorm/util.capnp.h>
#include "rpc-fixture.capnp.h"

namespace {

using sandstorm::Identity;
using sandstorm::SandstormApi;
using sandstorm::SandstormHttpBridge;
using sandstorm::SessionContext;
using sandstorm::StaticAsset;

kj::Timer* timer = nullptr;
constexpr auto DELAY = 100 * kj::MILLISECONDS;

std::string jsonString(kj::StringPtr s) {
  std::string out = "\"";
  for (char c: s) {
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      default: out += c;
    }
  }
  return out + "\"";
}

void emit(const std::string& line) {
  std::cout << line << std::endl;
}

// ── bridge mode ───────────────────────────────────────────────────────────────

int liveIdentities = 0;
int liveContexts = 0;

class StaticAssetImpl final: public StaticAsset::Server {
public:
  explicit StaticAssetImpl(kj::String path): path(kj::mv(path)) {}
  kj::Promise<void> getUrl(GetUrlContext context) override {
    auto results = context.getResults();
    results.setProtocol(StaticAsset::Protocol::HTTPS);
    results.setHostPath(path);
    return kj::READY_NOW;
  }
private:
  kj::String path;
};

class IdentityImpl final: public Identity::Server {
public:
  IdentityImpl(kj::StringPtr name, kj::StringPtr id): name(kj::str(name)), id(kj::str(id)) {
    ++liveIdentities;
  }
  ~IdentityImpl() noexcept(false) {
    --liveIdentities;
    emit("{\"released\":\"identity\",\"name\":" + jsonString(name) +
         ",\"liveIdentities\":" + std::to_string(liveIdentities) + "}");
  }
  kj::Promise<void> getProfile(GetProfileContext context) override {
    auto profile = context.getResults().initProfile();
    profile.initDisplayName().setDefaultText(kj::str(name, " Example"));
    profile.setPreferredHandle(name);
    profile.setPicture(kj::heap<StaticAssetImpl>(kj::str("example.org/", name, ".png")));
    profile.setPronouns(sandstorm::Profile::Pronouns::ROBOT);
    return kj::READY_NOW;
  }
  kj::String name;
  kj::String id;   // 32 hex characters, as X-Sandstorm-User-Id carries it
};

capnp::CapabilityServerSet<Identity> identities;

Identity::Client newIdentity(kj::StringPtr name, kj::StringPtr id) {
  return identities.add(kj::heap<IdentityImpl>(name, id));
}

// Which of OUR identities a capability handed back to us is, or "?".
kj::Promise<kj::String> identityName(Identity::Client cap) {
  return identities.getLocalServer(cap).then([](kj::Maybe<Identity::Server&> server) {
    KJ_IF_MAYBE(s, server) {
      return kj::str(static_cast<IdentityImpl&>(*s).name);
    }
    return kj::str("?");
  });
}

class SessionContextImpl final: public SessionContext::Server {
public:
  explicit SessionContextImpl(kj::StringPtr session): session(kj::str(session)) {
    ++liveContexts;
  }
  ~SessionContextImpl() noexcept(false) {
    --liveContexts;
    emit("{\"released\":\"context\",\"session\":" + jsonString(session) +
         ",\"liveContexts\":" + std::to_string(liveContexts) + "}");
  }

  kj::Promise<void> claimRequest(ClaimRequestContext context) override {
    auto params = context.getParams();
    KJ_REQUIRE(params.getRequestToken() == "good-token", "unknown request token");
    std::string perms = "[";
    for (auto p: params.getRequiredPermissions()) {
      if (perms.size() > 1) perms += ",";
      perms += p ? "true" : "false";
    }
    emit("{\"claimed\":" + jsonString(params.getRequestToken()) + ",\"session\":" +
         jsonString(session) + ",\"requiredPermissions\":" + perms + "]}");
    context.getResults().setCap(newIdentity("alice", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"));
    return kj::READY_NOW;
  }

  kj::Promise<void> activity(ActivityContext context) override {
    auto event = context.getParams().getEvent();
    auto users = event.getUsers();
    auto names = kj::heapArrayBuilder<kj::Promise<kj::String>>(users.size());
    for (auto user: users) {
      names.add(identityName(user.getIdentity()));
    }
    std::string head = "{\"activity\":{\"session\":" + jsonString(session) +
        ",\"path\":" + jsonString(event.getPath()) +
        ",\"type\":" + std::to_string(event.getType()) +
        ",\"caption\":" + (event.hasNotification()
            ? jsonString(event.getNotification().getCaption().getDefaultText())
            : std::string("null"));
    std::string flags;
    for (auto user: users) {
      flags += std::string(user.getMentioned() ? "m" : "-") + (user.getSubscribed() ? "s" : "-") + ",";
    }
    return kj::joinPromises(names.finish())
        .then([head = kj::mv(head), flags = kj::mv(flags)](kj::Array<kj::String> resolved) {
      std::string list = "[";
      size_t start = 0;
      for (size_t i = 0; i < resolved.size(); i++) {
        size_t comma = flags.find(',', start);
        std::string f = flags.substr(start, comma - start);
        start = comma + 1;
        if (i) list += ",";
        list += "{\"name\":" + jsonString(resolved[i]) + ",\"mentioned\":" +
                (f[0] == 'm' ? "true" : "false") + ",\"subscribed\":" +
                (f[1] == 's' ? "true" : "false") + "}";
      }
      emit(head + ",\"users\":" + list + "]}}");
    });
  }
private:
  kj::String session;
};

class SandstormApiImpl final: public SandstormApi<>::Server {
public:
  kj::Promise<void> getIdentityId(GetIdentityIdContext context) override {
    auto identity = context.getParams().getIdentity();
    return identities.getLocalServer(identity)
        .then([context](kj::Maybe<Identity::Server&> server) mutable {
      KJ_IF_MAYBE(s, server) {
        // 32 hex characters back to 16 bytes, padded to the 32 a real id has.
        auto id = static_cast<IdentityImpl&>(*s).id.asPtr();
        auto bytes = kj::decodeHex(id);
        auto out = context.getResults().initId(32);
        for (size_t i = 0; i < 32; i++) out[i] = i < bytes.size() ? bytes[i] : 0;
        return;
      }
      KJ_FAIL_REQUIRE("not an identity of this grain");
    });
  }
};

class BridgeImpl final: public SandstormHttpBridge::Server {
public:
  kj::Promise<void> getSandstormApi(GetSandstormApiContext context) override {
    context.getResults().setApi(kj::heap<SandstormApiImpl>());
    return kj::READY_NOW;
  }

  kj::Promise<void> getSessionContext(GetSessionContextContext context) override {
    // A PROMISE, resolved a little later: what a real bridge sends when the
    // session is still being set up, and what makes it send Resolve.
    auto session = kj::str(context.getParams().getId());
    emit("{\"getSessionContext\":" + jsonString(session) + "}");
    context.getResults().setContext(SessionContext::Client(timer->afterDelay(DELAY)
        .then([session = kj::mv(session)]() -> SessionContext::Client {
      return kj::heap<SessionContextImpl>(session);
    })));
    return kj::READY_NOW;
  }

  kj::Promise<void> getSavedIdentity(GetSavedIdentityContext context) override {
    auto id = context.getParams().getIdentityId();
    if (id == "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa") {
      context.getResults().setIdentity(newIdentity("alice", id));
    } else if (id == "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb") {
      context.getResults().setIdentity(newIdentity("bob", id));
    } else {
      KJ_FAIL_REQUIRE("no saved identity", id);
    }
    return kj::READY_NOW;
  }

  kj::Promise<void> saveIdentity(SaveIdentityContext context) override {
    return identityName(context.getParams().getIdentity()).then([](kj::String name) {
      emit("{\"saved\":" + jsonString(name) + "}");
    });
  }
};

// ── fixture mode ──────────────────────────────────────────────────────────────

int liveCounters = 0;

class CounterImpl final: public Counter::Server {
public:
  CounterImpl() { ++liveCounters; }
  ~CounterImpl() noexcept(false) {
    --liveCounters;
    emit("{\"released\":\"counter\",\"liveCounters\":" + std::to_string(liveCounters) + "}");
  }
  kj::Promise<void> next(NextContext context) override {
    context.getResults().setN(++calls);
    return kj::READY_NOW;
  }
private:
  uint32_t calls = 0;
};

class FixtureImpl final: public Fixture::Server {
public:
  kj::Promise<void> echoLater(EchoLaterContext context) override {
    auto cap = context.getParams().getCap();
    context.getResults().setCap(Counter::Client(timer->afterDelay(DELAY)
        .then([cap = kj::mv(cap)]() mutable -> Counter::Client { return kj::mv(cap); })));
    return kj::READY_NOW;
  }
  kj::Promise<void> serverCounterLater(ServerCounterLaterContext context) override {
    context.getResults().setCap(Counter::Client(timer->afterDelay(DELAY)
        .then([]() -> Counter::Client { return kj::heap<CounterImpl>(); })));
    return kj::READY_NOW;
  }
  kj::Promise<void> brokenLater(BrokenLaterContext context) override {
    context.getResults().setCap(Counter::Client(timer->afterDelay(DELAY)
        .then([]() -> Counter::Client { KJ_FAIL_REQUIRE("broken on purpose"); })));
    return kj::READY_NOW;
  }
  kj::Promise<void> liveServerCounters(LiveServerCountersContext context) override {
    context.getResults().setN(liveCounters);
    return kj::READY_NOW;
  }
};

}  // namespace

int main(int argc, char* argv[]) {
  if (argc != 3) {
    std::cerr << "usage: " << argv[0] << " <socket-path> bridge|fixture" << std::endl;
    return 2;
  }
  kj::StringPtr mode = argv[2];
  capnp::Capability::Client bootstrap = mode == "bridge"
      ? capnp::Capability::Client(kj::heap<BridgeImpl>())
      : capnp::Capability::Client(kj::heap<FixtureImpl>());
  capnp::EzRpcServer server(kj::mv(bootstrap), kj::str("unix:", argv[1]));
  timer = &server.getIoProvider().getTimer();
  auto& waitScope = server.getWaitScope();
  server.getPort().wait(waitScope);
  emit("{\"listening\":" + jsonString(argv[1]) + ",\"mode\":" + jsonString(mode) + "}");
  kj::NEVER_DONE.wait(waitScope);
}
