class __Promise {
  constructor(executor) {
    this.state = 'pending'
    this.value = undefined
    this.queue = []

    const transitionTo = state => v => {
      if (this.state !== 'pending') return
      this.state = state
      this.value = v
      this.queue.forEach(f => f())
    }

    try {
      executor(transitionTo('fulfilled'), transitionTo('rejected'))
    } catch (e) {
      transitionTo('rejected')(e)
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e }

    const promise2 = new __Promise((resolve, reject) => {
      const fn = () => {
        setTimeout(() => {
          try {
            const cb = this.state === 'fulfilled' ? onFulfilled : onRejected
            promiseResolve(promise2, cb(this.value), resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.state === 'pending') {
        this.queue.push(fn)
      } else {
        fn()
      }
    })
    return promise2
  }
}

function promiseResolve(promise2, x, resolve, reject) {
  if (x === promise2) return reject(new TypeError('Chaining cycle detected for promise'))

  //2.3.3.3.3
  let called = false;
  let once = (fn) => {
    if (called) return
    called = true
    fn()
  }
  if (x != null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      const then = x.then
      if (typeof then === 'function') {
        then.call(
          x,
          //2.3.3.3.3
          y => once(() => promiseResolve(promise2, y, resolve, reject)),
          r => once(() => reject(r))
        )
      } else {
        resolve(x)
      }
    } catch (e) {
      //2.3.3.3.4.1
      once(() => reject(e))
    }
  } else {
    resolve(x)
  }
}

module.exports = __Promise