import { P as Pipeline, R as Registry, I as Interface, S as Server } from '../shared/capnp-es.BVG6upt7.mjs';
import { S as Struct, O as ObjectSize, a as adopt, g as getPointer, d as disown, i as isNull, c as copyFrom } from '../shared/capnp-es.D8zdZmih.mjs';
import '../shared/capnp-es.BlZmb8ia.mjs';

const _capnpFileId = 0xb8630836983feed7n;
class Persistent_SaveParams extends Struct {
  static _capnp = {
    displayName: "SaveParams",
    id: "f76fba59183073a5",
    size: new ObjectSize(0, 1)
  };
  _adoptSealFor(value) {
    adopt(value, getPointer(0, this));
  }
  _disownSealFor() {
    return disown(this.sealFor);
  }
  /**
  * Seal the SturdyRef so that it can only be restored by the specified Owner. This is meant
  * to mitigate damage when a SturdyRef is leaked. See comments above.
  *
  * Leaving this value null may or may not be allowed; it is up to the realm to decide. If a
  * realm does allow a null owner, this should indicate that anyone is allowed to restore the
  * ref.
  *
  */
  get sealFor() {
    return getPointer(0, this);
  }
  _hasSealFor() {
    return !isNull(getPointer(0, this));
  }
  set sealFor(value) {
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "Persistent_SaveParams_" + super.toString();
  }
}
class Persistent_SaveResults extends Struct {
  static _capnp = {
    displayName: "SaveResults",
    id: "b76848c18c40efbf",
    size: new ObjectSize(0, 1)
  };
  _adoptSturdyRef(value) {
    adopt(value, getPointer(0, this));
  }
  _disownSturdyRef() {
    return disown(this.sturdyRef);
  }
  get sturdyRef() {
    return getPointer(0, this);
  }
  _hasSturdyRef() {
    return !isNull(getPointer(0, this));
  }
  set sturdyRef(value) {
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "Persistent_SaveResults_" + super.toString();
  }
}
class Persistent_SaveResults$Promise {
  pipeline;
  constructor(pipeline) {
    this.pipeline = pipeline;
  }
  async promise() {
    return await this.pipeline.struct();
  }
}
class Persistent$Client {
  client;
  static interfaceId = 0xc8cb212fcd9f5691n;
  constructor(client) {
    this.client = client;
  }
  static methods = [
    {
      ParamsClass: Persistent_SaveParams,
      ResultsClass: Persistent_SaveResults,
      interfaceId: Persistent$Client.interfaceId,
      methodId: 0,
      interfaceName: "persistent.capnp:Persistent",
      methodName: "save"
    }
  ];
  /**
  * Save a capability persistently so that it can be restored by a future connection.  Not all
  * capabilities can be saved -- application interfaces should define which capabilities support
  * this and which do not.
  *
  */
  save(paramsFunc) {
    const answer = this.client.call({
      method: Persistent$Client.methods[0],
      paramsFunc
    });
    const pipeline = new Pipeline(Persistent_SaveResults, answer);
    return new Persistent_SaveResults$Promise(pipeline);
  }
}
Registry.register(Persistent$Client.interfaceId, Persistent$Client);
class Persistent$Server extends Server {
  target;
  constructor(target) {
    super(target, [
      {
        ...Persistent$Client.methods[0],
        impl: target.save
      }
    ]);
    this.target = target;
  }
  client() {
    return new Persistent$Client(this);
  }
}
class Persistent extends Interface {
  static SaveParams = Persistent_SaveParams;
  static SaveResults = Persistent_SaveResults;
  static Client = Persistent$Client;
  static Server = Persistent$Server;
  static _capnp = {
    displayName: "Persistent",
    id: "c8cb212fcd9f5691",
    size: new ObjectSize(0, 0)
  };
  toString() {
    return "Persistent_" + super.toString();
  }
}

export { Persistent, Persistent$Client, Persistent$Server, Persistent_SaveParams, Persistent_SaveResults, Persistent_SaveResults$Promise, _capnpFileId };
