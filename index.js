class __Promise {
  constructor(fn) {
    if (!(fn instanceof Function)) {
      throw new TypeError('')
    }

    this.state = 'pending';
    this.value = undefined;
    this.queue = []
    this.thenResult = null

    try{
      fn(this.resolve, this.reject)
    }catch(e){
      this.reject(e)
    }
  }

  resolve = value => {
    if (this.state !== 'pending') return
    this.state = 'fulfilled'
    this.value = value
    this.queue.forEach(f => f())
  }

  reject = reason => {
    if (this.state !== 'pending') return
    this.state = 'rejected'
    this.value = reason

    this.queue.forEach(f => f())
  }

  then(onFulfilled, onRejected) {
    onFulfilled = onFulfilled instanceof Function ? onFulfilled : v => v
    onRejected = onRejected instanceof Function ? onRejected : e => { throw e }
    this.thenResult = new __Promise((resolve, reject) => {
      const fn = () => {
        setTimeout(() => {
          let x
          try {
            const cb = this.state === 'fulfilled' ? onFulfilled : onRejected
            x = cb.call(undefined, this.value)
          } catch (e) {
            reject(e)
            return
          }
          this.thenResult.promiseResolve(x)
        })
      }
  
      if (this.state === 'pending') {
        this.queue.push(fn)
      } else {
        fn()
      }
     })
    return this.thenResult
  }

  promiseResolve(x) {
    if (this === x) {
      return this.reject(new TypeError('Chaining cycle detected for promise'))
    }


    if (x instanceof __Promise) {
      x.then(
        v => this.resolve(v),
        e => this.reject(e)
      )
      return
    }
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      let then;
      try {
        then = x.then
      } catch (e) {
        this.reject(e)
      }
      if (typeof then === 'function') {
        try {
          then.call(
            x,
            y => this.promiseResolve(y),
            r => this.reject(r)
          )
        } catch (e) {
          this.reject(e)
        }
      } else {
        this.resolve(x)
      }
    } else {
      this.resolve(x)
    }
  }
}

module.exports = __Promise