/**
 * Empty stub used to satisfy native-only imports when bundling for web.
 * Anything that touches this will get an empty default export + named no-ops.
 */
const noop = () => null;
const stub = new Proxy(function () {}, {
  get: (_target, prop) => {
    if (prop === '__esModule') return true;
    if (prop === 'default') return noop;
    return noop;
  },
  apply: () => null,
});
module.exports = stub;
module.exports.default = noop;
