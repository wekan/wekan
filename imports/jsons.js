Jsons = {
  stringify(value) {
    const ret = JSON.stringify(value, this.replacer, 2);
    return ret;
  },

  parse(value) {
    const ret = JSON.parse(value, this.reviver);
    return ret;
  },

  // https://stackoverflow.com/questions/12075927/serialization-of-regexp/33416684#33416684
  replacer(key, value) {
    if (value instanceof RegExp)
      return ("___REGEXP___ " + value.toString());
    else
      return value;
  },

  // https://stackoverflow.com/questions/12075927/serialization-of-regexp/33416684#33416684
  reviver(key, value) {
    if (value?.toString()?.indexOf("___REGEXP___ ") == 0) {
      const m = value.split("___REGEXP___ ")[1].match(/\/(.*)\/(.*)?/);
      return new RegExp(m[1], m[2] || "");
    } else
      return value;
  }
}

export { Jsons }
