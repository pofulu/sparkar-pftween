const Time = require('Time');

/**
 *
 * @param {EventSource} eventSource
 * @param {{(any?:any):void}} call
 */
export function invokeOnce(eventSource, call) {
    const once = eventSource.subscribe(any => {
        once.unsubscribe();
        call(any);
    });

    return once;
}

/**
 *
 * @param {EventSource} eventSource
 * @param {{(any?:any):void}} call
 * @return {Promise<any>}
 */
export function invokeOnceThen(eventSource, call = () => { }) {
    return new Promise(resolve => {
        invokeOnce(eventSource, i => {
            call(i);
            resolve(i);
        })
    })
}

/**
 *
 * @param {EventSource[]} eventSourceList
 * @param {{(any?:any):void}} call
 */
export function invokeOnceList(eventSourceList, call) {
    let events = [];
    eventSourceList.forEach(i => {
        events.push(i.subscribe(any => {
            call(any);
            unsubscribeAll();
        }));
    })

    function unsubscribeAll() {
        events.forEach(e => {
            e.unsubscribe();
        });
    }

    return new class {
        unsubscribe() {
            unsubscribeAll();
        }
    }
}

/**
 * 
 * @param {EventSource[]} eventSourceList 
 * @param {{(any?:any):void}} call 
 */
export function subscribeList(eventSourceList, call) {
    eventSourceList.forEach(i => {
        i.subscribe(call);
    });
}

export function onSetSignal(signal, callback = () => { }) {
    return invokeOnce(signal.monitor({ 'fireOnInitialValue': true }).select('newValue'), callback);
}

export function onSetSignalThen(signal, callback = () => { }) {
    return invokeOnceThen(signal.monitor({ 'fireOnInitialValue': true }).select('newValue'), callback);
}

export function nextFrameAsync(callback = () => { }) {
    return onSetSignalThen(Time.ms, callback);
}

export function nextFrame(callback = () => { }) {
    return onSetSignal(Time.ms, callback)
}

/**
 * The monitorManyDiff() is for monitoring different type of signals at the same time, as Reactive.monitorMany() can only monitor ScalarSignal.
 * This function support `ScalarSignal`, `BooleanSignal`, `StringSignal`.
 * Please note that you can only get 'newValue' of every signal, and the fire frequency is slower one frame than build-in monitorMany() as this function is depend on fireOnInitialValue.
 * @param {*} signals 
 * @param {{fireOnInitialValue: boolean}=} config 
 */
export function monitorManyDiff(signals, config) {
    const _signalPairs = [];

    for (var property in signals) {
        _signalPairs.push({
            name: property,
            value: signals[property]
        });
    }

    let _subscription;
    let _callback;

    function invoke(config) {
        let invoked = false;
        const fireOnInitialValue = config ? config.fireOnInitialValue : false;

        _subscription = invokeOnceList(_signalPairs.map(sig => sig.value.monitor({ fireOnInitialValue: fireOnInitialValue }).select('newValue')), () => {
            if (invoked) {
                return;
            }
            invoked = true;

            const result = {};
            for (let i = 0; i < _signalPairs.length; i++) {
                result[_signalPairs[i].name] = _signalPairs[i].value.pinLastValue();
            }

            _callback(result)
            invoke();
        })
    }

    return new class {
        subscribe(callback) {
            invoke(config);
            _callback = callback;

            return new class {
                unsubscribe() {
                    _subscription.unsubscribe();
                }
            }
        }
    }
}
