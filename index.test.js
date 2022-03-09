const chai = require('chai')
const sinonChai = require('sinon-chai')
const sinon = require('sinon')
const { describe, it } = require('mocha')
const __Promise = require('./index')

chai.use(sinonChai)
const expect = chai.expect

describe('promise constructor', () => {
  it('promise parameter must is a function', () => {
    expect(__Promise).to.throw(TypeError)
  })

  it('new __Promise return instance object', () => {
    const p = new __Promise(() => { })
    expect(p).to.instanceOf(__Promise)
  })

  it('function called', () => {
    const cb = sinon.fake()
    const p = new __Promise(cb)

    expect(cb.called).to.eq(true)
  })

  it('instance object must have a `then` function', () => {
    const p = new __Promise(() => { })
    expect(p.then).to.instanceOf(Function)
  })
})

describe('about promise state', () => {
  it('transition fulfilled', () => {
    const p = new __Promise(resolve => {
      resolve('success')
    })

    expect(p.state).to.eq('fulfilled')
    expect(p.value).to.eq('success')
  })

  it('transition rejected', () => {
    const err = new Error('whoops')
    const p = new __Promise((resolve, reject) => {
      reject(err)
    })

    expect(p.state).to.eq('rejected')
    expect(p.value).to.eq(err)
  })

  it('transition only onece', () => {
    const p1 = new __Promise((resolve, reject) => {
      resolve('one')
      reject('two')
    })

    expect(p1.state).to.eq('fulfilled')
    expect(p1.value).to.eq('one')

    const p2 = new __Promise((resolve, reject) => {
      reject('one')
      resolve('two')
    })

    expect(p2.state).to.eq('rejected')
    expect(p2.value).to.eq('one')
  })
})

describe('then function: onFulfilled/onRejected', () => {
  it('2.2.2', done => {
    const cb = sinon.fake()
    const p = new __Promise(resolve => {
      expect(cb.called).to.eq(false)
      resolve('test')
    })
    p.then(cb)
    setTimeout(() => {
      expect(cb.called).to.eq(true)
      expect(cb).to.calledWith('test')
      expect(cb.callCount).to.eq(1)
      done()
    })
  })
  it('2.2.3', done => {
    const cb = sinon.fake()
    const err = new Error('whoops')
    const p = new __Promise((resolve, reject) => {
      expect(cb.called).to.eq(false)
      reject(err)
    })
    p.then(null, cb)
    setTimeout(() => {
      expect(cb.called).to.eq(true)
      expect(cb).to.calledWith(err)
      expect(cb.callCount).to.eq(1)
      done()
    })
  })

  it('onFulfilled/onRejected inside not have `this`', () => {
    const cb = function () {
      expect(this).to.eq(undefined)
    }
    const p1 = new __Promise(resolve => {
      resolve(1)
    })
    p1.then(cb)

    const p2 = new __Promise((resolve, reject) => {
      reject(1)
    })
    p2.then(null, cb)
  })

  it('then called multiple times on the same promise, and execute in the order: **onFulfilled**', done => {
    const cb1 = sinon.fake()
    const cb2 = sinon.fake()
    const cb3 = sinon.fake()
    const p = new __Promise(resolve => {
      resolve(1)
    })

    p.then(cb1)
    p.then(cb2)
    p.then(cb3)
    setTimeout(() => {
      expect(cb1.called).to.eq(true)
      expect(cb2.called).to.eq(true)
      expect(cb3.called).to.eq(true)
      expect(cb1).to.calledBefore(cb2)
      expect(cb2).to.calledBefore(cb3)
      done()
    })
  })

  it('then called multiple times on the same promise, and execute in the order: **onRejected**', done => {
    const cb1 = sinon.fake()
    const cb2 = sinon.fake()
    const cb3 = sinon.fake()
    const p = new __Promise((resolve, reject) => {
      reject(1)
    })

    p.then(null, cb1)
    p.then(null, cb2)
    p.then(null, cb3)
    setTimeout(() => {
      expect(cb1.called).to.eq(true)
      expect(cb2.called).to.eq(true)
      expect(cb3.called).to.eq(true)
      expect(cb1).to.calledBefore(cb2)
      expect(cb2).to.calledBefore(cb3)
      done()
    })
  })
})

describe('promise resolve', () => {
  it('then function must return a promise', () => {
    const p1 = new __Promise(resolve => resolve())
    const p2 = p1.then()
    expect(p2).to.instanceOf(__Promise)
  })
})

describe('2.2.7', () => {
  describe('2.2.7.1 promise resolve', () => {
    describe('2.3.2', () => {
      it('2.3.2.1', done => {
        const result = new __Promise(resolve => {
          setTimeout(() => {
            resolve(123)
          })
        })
        const p1 = new __Promise(resolve => resolve(result))
        const p2 = p1.then(v => v)

        setTimeout(() => {
          expect(result.state).to.eq('fulfilled')
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq(123)
          done()
        }, 10)
      })

      it('2.3.2.2', done => {
        const result = new __Promise(resolve => resolve('test'))
        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => result)

        setTimeout(() => {
          expect(result.state).to.eq('fulfilled')
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq('test')
          done()
        }, 10)
      })

      it('2.3.2.3', done => {
        const result = new __Promise((resolve, reject) => reject('test'))
        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => result)

        setTimeout(() => {
          expect(result.state).to.eq('rejected')
          expect(p2.state).to.eq('rejected')
          expect(p2.value).to.eq('test')
          done()
        }, 10)
      })
    })
    describe('2.3.3', () => {
      it('2.3.3.1', done => {
        let count = 0;
        let obj = Object.create(null, {
          then: {
            get: function () {
              count += 1;
              return (onFulfilled) => onFulfilled(999)
            }
          }
        })

        let p1 = new __Promise(resolve => resolve())
        let p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('fulfilled')
          done()
        })
      })
      it('2.3.3.2', done => {
        let obj = {
          then() { }
        }
        Object.defineProperty(obj, 'then', {
          get() {
            throw new Error('can not get!')
          }
        })

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('rejected')
          expect(p2.value.message).to.eq('can not get!')
          done()
        })
      })

      it('2.3.3.3', done => {
        const obj = {
          then(onFulfilled, onRejected) {
            expect(this).to.eq(obj)
            onFulfilled('1')
          }
        }

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq('1')
          done()
        })
      })

      it('2.3.3.3.1', done => {
        const obj = {
          then(onFulfilled, onRejected) {
            onFulfilled('yeah')
          }
        }

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq('yeah')
          done()
        })
      })

      it('2.3.3.3.2', done => {
        const err = new Error('whoops')
        const obj = {
          then(onFulfilled, onRejected) {
            onRejected(err)
          }
        }

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('rejected')
          expect(p2.value).to.eq(err)
          done()
        })
      })

      it('2.3.3.3.3: **resolvePromise**', done => {
        const obj = {
          then(onFulfilled, onRejected) {
            onFulfilled(123)
            onFulfilled(222)
          }
        }

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq(123)
          done()
        })
      })

      it('2.3.3.3.3: **rejectPromise**', done => {
        const err = new Error('whoops')
        const obj = {
          then(onFulfilled, onRejected) {
            onRejected(err)
            onFulfilled(222)
          }
        }

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('rejected')
          expect(p2.value).to.eq(err)
          done()
        })
      })

      it('2.3.3.3.4.1', done => {
        const err = new Error('whoops')
        const obj = {
          then(onFulfilled, onRejected) {
            onFulfilled(123)
            throw err
          }
        }

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq(123)
          done()
        })
      })

      it('2.3.3.3.4.2', done => {
        const err = new Error('whoops')
        const obj = {
          then(onFulfilled, onRejected) {
            throw err
          }
        }

        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('rejected')
          expect(p2.value).to.eq(err)
          done()
        })
      })

      it('2.3.3.4', done => {
        let obj = {
          then: "I'm not a object"
        }
        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => obj)

        setTimeout(() => {
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq(obj)
          done()
        })
      })

      it('2.3.4', done => {
        const p1 = new __Promise(resolve => resolve())
        const p2 = p1.then(v => 1)

        setTimeout(() => {
          expect(p2.state).to.eq('fulfilled')
          expect(p2.value).to.eq(1)
          done()
        })
      })
    })
  })

  it('2.2.7.2', done => {
    const p1 = new __Promise(resolve => resolve())
    const p2 = p1.then(v => { throw new Error('whoops') })

    const p3 = new __Promise((resolve, reject) => reject())
    const p4 = p3.then(null, v => { throw new Error('error') })

    setTimeout(() => {
      expect(p2.state).to.eq('rejected')
      expect(p2.value.message).to.eq('whoops')
      expect(p4.state).to.eq('rejected')
      expect(p4.value.message).to.eq('error')
      done()
    })
  })

  it('2.2.7.3', done => {
    const p1 = new __Promise(resolve => resolve('success'))
    const p2 = p1.then()

    const p3 = new __Promise((resolve, reject) => reject("fail"))
    const p4 = p3.then()

    setTimeout(() => {
      expect(p2.state).to.eq(p1.state)
      expect(p2.value).to.eq(p1.value)
      expect(p4.state).to.eq(p4.state)
      expect(p4.value).to.eq(p4.value)
      done()
    })
  })

  it('2.2.7.4', done => {
    const p1 = new __Promise((resolve, reject) => reject("fail"))
    const p2 = p1.then()
    setTimeout(() => {
      expect(p2.state).to.eq(p2.state)
      expect(p2.value).to.eq(p2.value)
      done()
    })
  })
})

