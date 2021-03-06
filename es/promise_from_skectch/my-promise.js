// @杰杰大帅帅 @gogoend
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'


function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        return reject(new TypeError('circular call.'))
    }
    let called = false
    if (x instanceof MyPromise) {
        if (x.status === PENDING) {
            x.then(y => {
                resolvePromise(promise2, y, resolve, reject)
            }, reason => {
                reject(reason)
            })
        }
    } else if (x !== null && ((typeof x === 'object') || typeof x === 'function')) {
        try {
            let then = x.then
            // thenable
            if (typeof then === 'function') {
                then.call(x, y => {
                    if (called) return
                    called = true
                    resolvePromise(promise2, y, resolve, reject)
                }, reason => {
                    if (called) return
                    called = true
                    reject(reason)
                })
            } else {
                resolve(x)
            }
        } catch (err) {
            if (called) return
            called = true
            reject(err)
        }
    } else {
        resolve(x)
    }
}

function MyPromise(func) {
    this.status = PENDING
    this.val = undefined

    // 据了解，Promise中可以有多个then和catch，所以此处使用数组来保存函数
    this.fulfilledCbs = []
    this.rejectedCbs = []

    let _this = this
    let resolve, _resolve = function (val) {
        if (val instanceof MyPromise) {
            return val.then(resolve, reject)
        }
        setTimeout(() => {
            let { status, fulfilledCbs } = _this
            if (status === PENDING) {
                _this.val = val
                _this.status = FULFILLED
                for (let i = 0; i < fulfilledCbs.length; i++) {
                    // 将val作为回调函数的参数返回去
                    fulfilledCbs[i].call(_this, val)
                }
            }
        }, 0)
    }
    let reject, _reject = function (val) {
        setTimeout(() => {
            let { status, rejectedCbs } = _this
            if (status === PENDING) {
                _this.val = val
                _this.status = REJECTED
                for (let i = 0; i < rejectedCbs.length; i++) {
                    // 将val作为回调函数的参数返回去
                    rejectedCbs[i].call(_this, val)
                }
            }
        }, 0)

    }

    resolve = _resolve.bind(this)
    reject = _reject.bind(this)

    try {
        func(resolve, reject)
    } catch (err) {
        reject(err)
    }

}

Object.assign(MyPromise.prototype, {
    then: function (onFulfilled, onRejected) {
        let _this = this
        let { status, fulfilledCbs, rejectedCbs } = this

        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
        onRejected = typeof onRejected === 'function' ? onRejected : err => { throw (err) }

        let promise2 = new MyPromise((resolve, reject) => {
            if (status === PENDING) {
                fulfilledCbs.push((val) => {
                    setTimeout(() => {
                        try {
                            let x = onFulfilled(val)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (err) {
                            reject(err)
                        }
                    }, 0)
                })
                rejectedCbs.push((val) => {
                    setTimeout(() => {
                        try {
                            let x = onRejected(val)
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (err) {
                            reject(err)
                        }
                    }, 0)
                })
            }

            if (status === FULFILLED) {
                setTimeout((val) => {
                    try {
                        let x = onFulfilled(val)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (err) {
                        reject(err)
                    }
                }, 0)
            }

            if (status === REJECTED) {
                setTimeout((val) => {
                    try {
                        let x = onRejected(val)
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (err) {
                        reject(err)
                    }
                }, 0)
            }
        })

        return promise2

    }
})

// // --------- 测试用 ---------
// MyPromise.deferred = function () { // 延迟对象
//     let defer = {};
//     defer.promise = new MyPromise((resolve, reject) => {
//         defer.resolve = resolve;
//         defer.reject = reject;
//     });
//     return defer;
// }

// try { module.exports = MyPromise } catch (e) {}
// // -------------------------

export default MyPromise