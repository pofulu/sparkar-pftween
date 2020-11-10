const Reactive = require('Reactive');
const Time = require('Time');

/**
 * Support `number`, `ScalarSignal`, `Point2DSignal`, `PointSignal`, `Point4DSignal`, `VectorSignal`
 * @returns {any}
 */
export function remapClamp(input, fromMin, fromMax, toMin, toMax) {
    return Reactive.clamp(remap(input, fromMin, fromMax, toMin, toMax), Reactive.min(toMin, toMax), Reactive.max(toMin, toMax));
}

/**
 * Support `number`, `ScalarSignal`, `Point2DSignal`, `PointSignal`, `Point4DSignal`, `VectorSignal`
 * @returns {any}
 */
export function remap(input, fromMin, fromMax, toMin, toMax) {
    return Reactive.toRange(Reactive.fromRange(input, fromMin, fromMax), toMin, toMax);
}

/**
 * Convert degree to radian, input can be number or signal but the is return always signal.
 * @param {*} degree 
 */
export function toRadian(degree) {
    return remap(degree, -180, 180, -Math.PI, Math.PI);
}

/**
 * Convert radian to degree, input can be number or signal but the is return always signal.
 * @param {*} radian
 */
export function toDegree(radian) {
    return remap(radian, -Math.PI, Math.PI, -180, 180);
}

/**
 * Convert scalar signal to number, or the signal that contains 'xyzw' to array of numbers.
 * @param {*} signal 
 * @returns {number | number[]}
 */
export function toNumber(signal) {
    if (typeof signal == 'number') {
        return signal;
    }

    if (Array.isArray(signal)) {
        return signal;
    }

    if (signal.pinLastValue) {
        return signal.pinLastValue();
    }

    let arr;

    if (signal.x && signal.x.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.x.pinLastValue());
    }

    if (signal.y && signal.y.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.y.pinLastValue());
    }

    if (signal.z && signal.z.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.z.pinLastValue());
    }

    if (signal.w && signal.w.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.w.pinLastValue());
    }

    return arr;
}

/**
 * Convert scalar or the signal that contains 'xyzw' to array of numbers.
 * @param {*} signal 
 * @returns {number[]}
 */
export function toNumbers(signal) {
    if (typeof signal == 'number') {
        return [signal];
    }

    if (Array.isArray(signal)) {
        return signal;
    }

    if (signal.pinLastValue) {
        return [signal.pinLastValue()];
    }

    let arr;

    if (signal.x && signal.x.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.x.pinLastValue());
    }

    if (signal.y && signal.y.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.y.pinLastValue());
    }

    if (signal.z && signal.z.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.z.pinLastValue());
    }

    if (signal.w && signal.w.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(signal.w.pinLastValue());
    }

    return arr;
}

/**
 * Take input numbers and output them in a different order. 
 * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1). 
 * @param {*} value A number or vector that you want to reorder. 
 * @param {string} specifier The order to output the values. Use (xyzw) and (01).
 * @returns {*} The values in your chosen order.
 */
export function swizzle(value, specifier) {
    const isArray = Array.isArray(value);

    const signal = element => {
        const swizzleSignal = property => {
            if (typeof (value) == 'number') {
                if (property == 'x') {
                    return value;
                } else {
                    throw `Specifier '${property}' in '${specifier}' can't be used with this signal.`;
                }
            } else if (value['pinLastValue'] != undefined) {
                if (property == 'x') {
                    return value;
                } else {
                    throw `Specifier '${property}' in '${specifier}' can't be used with this signal.`;
                }
            } else {
                if (value[property] == undefined) {
                    throw `Specifier '${property}' in '${specifier}' can't be used with this signal.`;
                } else {
                    return value[property];
                }
            }
        }

        switch (element) {
            case '0': return 0;
            case '1': return 1;
            case 'x': return isArray ? (value[0] ? value[0] : 0) : swizzleSignal('x');
            case 'y': return isArray ? (value[1] ? value[1] : 0) : swizzleSignal('y');
            case 'z': return isArray ? (value[2] ? value[2] : 0) : swizzleSignal('z');
            case 'w': return isArray ? (value[3] ? value[3] : 0) : swizzleSignal('w');
            case 'r': return isArray ? (value[0] ? value[0] : 0) : swizzleSignal('x');
            case 'g': return isArray ? (value[1] ? value[1] : 0) : swizzleSignal('y');
            case 'b': return isArray ? (value[2] ? value[2] : 0) : swizzleSignal('z');
            case 'a': return isArray ? (value[3] ? value[3] : 0) : swizzleSignal('w');
            default: throw `Invalid swizzle element specifier: '${element}' in '${specifier}'`;
        }
    }

    switch (specifier.length) {
        case 1: return signal(specifier[0]);
        case 2: return Reactive.pack2(signal(specifier[0]), signal(specifier[1]));
        case 3: return Reactive.pack3(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]));
        case 4: return Reactive.pack4(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]), signal(specifier[3]));
        default: throw `Invalid swizzle specifier: '${specifier}'`;
    }
}

/**
 * Convert Point4DSignal to RGBASignal.
 * @param {Point4DSignal} point4D 
 */
export function vec4_toRGBA(point4D) {
    return Reactive.RGBA(point4D.x, point4D.y, point4D.z, point4D.w);
}

/**
 * Convert Point4DSignal to HSVASignal.
 * @param {Point4DSignal} point4D 
 */
export function vec4_toHSVA(point4D) {
    return Reactive.HSVA(point4D.x, point4D.y, point4D.z, point4D.w);
}

/**
 * Invoke an EventSource only one time then `unsubscribe()` it. It's equivalent to `take(1)`.
 * @param {EventSource} eventSource
 * @param {{(any?: any): void}} callback
 */
export function invokeOnce(eventSource, callback) {
    return eventSource.take(1).subscribe(callback);
}

/**
 * Invoke an EventSource only one time then `unsubscribe()` it. It's should be equivalent to `take(1)`.
 * This function return a Promise and the result is the callback of `subscribe()`.
 * @param {EventSource} eventSource
 * @param {{(any?: any): void}} callback
 * @return {Promise<any>}
 */
export function invokeOnceAsync(eventSource, callback = () => { }) {
    return new Promise(resolve => {
        invokeOnce(eventSource, i => {
            callback(i);
            resolve(i);
        })
    })
}

/**
 * If any one of the EventSource list is called, all subscriptions are unsubscribed.
 * @param {EventSource[]} eventSourceList
 * @param {{(any?:any):void}} callback
 */
export function invokeOnceOrList(eventSourceList, callback) {
    let events = [];
    eventSourceList.forEach(i => {
        events.push(i.subscribe(any => {
            callback(any);
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
 * Subscribe the same callback function to all EventSource.
 * @param {EventSource[]} eventSourceList 
 * @param {{(any?:any):void}} callback 
 */
export function subscribeList(eventSourceList, callback) {
    eventSourceList.forEach(i => {
        i.subscribe(callback);
    });
}

/**
 * Invoke callback when `signal` is updated, it depends on `monitor({'fireOnInitialValue': true})`.
 * @param {*} signal 
 * @param {{(any?:any):void}} callback 
 */
export function nextSignal(signal, callback = () => { }) {
    return invokeOnce(signal.monitor({ 'fireOnInitialValue': true }).select('newValue'), callback);
}

/**
 * Invoke callback when `signal` is updated, it depends on `monitor({'fireOnInitialValue': true})`.
 * This function return a Promise and the result is the callback of `subscribe()`.
 * @param {*} signal 
 * @param {{(any?:any):void}} callback 
 */
export function nextSignalAsync(signal, callback = () => { }) {
    return invokeOnceAsync(signal.monitor({ 'fireOnInitialValue': true }).select('newValue'), callback);
}

/**
 * Invoke callback when next frame.
 * This function return a Promise and the result is runtime.
 * @param {{(runtime?: number): void}} callback 
 * @returns {Promise<number>}
 */
export function nextFrameAsync(callback = () => { }) {
    return nextSignalAsync(Time.ms, callback);
}

/**
 * Invoke callback when next frame. The callback value is runtime.
 * @param {{(runtime?: number): void}} callback 
 */
export function nextFrame(callback = () => { }) {
    return nextSignal(Time.ms, callback)
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

        _subscription = invokeOnceOrList(_signalPairs.map(sig => sig.value.monitor({ fireOnInitialValue: fireOnInitialValue }).select('newValue')), () => {
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

/**
 * Covert Hex color to RGB in 0-1 range. The default alpha is `1`.
 * @param {string} hex 
 * @returns {RgbaSignal}
 */
export function hex_toRGBA(hex, alpha = 1) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? Reactive.RGBA(
        parseInt(result[1], 16) / 256,
        parseInt(result[2], 16) / 256,
        parseInt(result[3], 16) / 256,
        alpha
    ) : null;
}

/**
 * @param {number} ms 
 */
export function delay(ms) {
    return new Promise(resolve => Time.setTimeout(resolve, ms))
}

export const Color = {
    red: hex_toRGBA('#FF0000'),
    white: hex_toRGBA('#FFFFFF'),
    cyan: hex_toRGBA('#00FFFF'),
    silver: hex_toRGBA('#C0C0C0'),
    blue: hex_toRGBA('#0000FF'),
    grey: hex_toRGBA('#808080'),
    darkBlue: hex_toRGBA('#0000A0'),
    black: hex_toRGBA('#000000'),
    lightBlue: hex_toRGBA('#ADD8E6'),
    orange: hex_toRGBA('#FFA500'),
    purple: hex_toRGBA('#800080'),
    brown: hex_toRGBA('#A52A2A'),
    yellow: hex_toRGBA('#FFFF00'),
    maroon: hex_toRGBA('#800000'),
    lime: hex_toRGBA('#00FF00'),
    green: hex_toRGBA('#008000'),
    magenta: hex_toRGBA('#FF00FF'),
    olive: hex_toRGBA('#808000'),
    clear: Reactive.pack4(0, 0, 0, 0),
}
