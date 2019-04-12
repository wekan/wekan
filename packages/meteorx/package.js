Package.describe({
  name: "meteorhacks:meteorx",
  summary: "Proxy for getting another meteorx fork",
  version: "1.4.1"
});

Package.onUse((api) => {
  api.export("MeteorX");
  api.use([
    "lamhieu:meteorx",
  ]);
});

