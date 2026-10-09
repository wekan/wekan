class TypedStack {
  constructor(type) {
    this._type = type;
    this._stack = [];
  }

  get size() {
    return this._stack.length;
  }

  pop() {
    const tos = this._stack.pop();
    return tos || new this._type();
  }

  push(instance) {
    if (!(instance instanceof this._type)) {
      throw new Error('Invalid type pushed to TypedStack');
    }
    this._stack.push(instance);
  }
}

module.exports = TypedStack;
