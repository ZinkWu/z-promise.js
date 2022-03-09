const __Promise = require('./index')

module.exports = {
  Promise: __Promise,
  deferred: function() {
    let resolve, reject
    return {
      promise: new __Promise(function(_resolve, _reject) {
        resolve = _resolve
        reject = _reject
      }),
      resolve,
      reject
    }
  }
}
