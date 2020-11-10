const Reactive = require('Reactive');
const Time = require('Time');

/**
 * Convert scalar signal to number, or the signal that contains 'xyzw' to array of numbers.
 * @param {*} signal 
 * @returns {number | number[]}
 */
function toNumber(signal) {
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
function toNumbers(signal) {
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
function swizzle(value, specifier) {
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
        };

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
    };

    switch (specifier.length) {
        case 1: return signal(specifier[0]);
        case 2: return Reactive.pack2(signal(specifier[0]), signal(specifier[1]));
        case 3: return Reactive.pack3(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]));
        case 4: return Reactive.pack4(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]), signal(specifier[3]));
        default: throw `Invalid swizzle specifier: '${specifier}'`;
    }
}

/**
 * Invoke an EventSource only one time then `unsubscribe()` it. It's equivalent to `take(1)`.
 * @param {EventSource} eventSource
 * @param {{(any?: any): void}} callback
 */
function invokeOnce(eventSource, callback) {
    return eventSource.take(1).subscribe(callback);
}

/**
 * Invoke an EventSource only one time then `unsubscribe()` it. It's should be equivalent to `take(1)`.
 * This function return a Promise and the result is the callback of `subscribe()`.
 * @param {EventSource} eventSource
 * @param {{(any?: any): void}} callback
 * @return {Promise<any>}
 */
function invokeOnceAsync(eventSource, callback = () => { }) {
    return new Promise(resolve => {
        invokeOnce(eventSource, i => {
            callback(i);
            resolve(i);
        });
    })
}

/**
 * Invoke callback when `signal` is updated, it depends on `monitor({'fireOnInitialValue': true})`.
 * This function return a Promise and the result is the callback of `subscribe()`.
 * @param {*} signal 
 * @param {{(any?:any):void}} callback 
 */
function nextSignalAsync(signal, callback = () => { }) {
    return invokeOnceAsync(signal.monitor({ 'fireOnInitialValue': true }).select('newValue'), callback);
}

/**
 * Invoke callback when next frame.
 * This function return a Promise and the result is runtime.
 * @param {{(runtime?: number): void}} callback 
 * @returns {Promise<number>}
 */
function nextFrameAsync(callback = () => { }) {
    return nextSignalAsync(Time.ms, callback);
}

/**
 * Covert Hex color to RGB in 0-1 range. The default alpha is `1`.
 * @param {string} hex 
 * @returns {RgbaSignal}
 */
function hex_toRGBA(hex, alpha = 1) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? Reactive.RGBA(
        parseInt(result[1], 16) / 256,
        parseInt(result[2], 16) / 256,
        parseInt(result[3], 16) / 256,
        alpha
    ) : null;
}

const Color = {
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
};

const Animation = require('Animation');
const Reactive$1 = require('Reactive');
const Time$1 = require('Time');
const Diagnostics = require('Diagnostics');

const samplers = {
    linear: (begin, end) => Animation.samplers.linear(begin, end),
    easeInQuad: (begin, end) => Animation.samplers.easeInQuad(begin, end),
    easeOutQuad: (begin, end) => Animation.samplers.easeOutQuad(begin, end),
    easeInOutQuad: (begin, end) => Animation.samplers.easeInOutQuad(begin, end),
    easeInCubic: (begin, end) => Animation.samplers.easeInCubic(begin, end),
    easeOutCubic: (begin, end) => Animation.samplers.easeOutCubic(begin, end),
    easeInOutCubic: (begin, end) => Animation.samplers.easeInOutCubic(begin, end),
    easeInQuart: (begin, end) => Animation.samplers.easeInQuart(begin, end),
    easeOutQuart: (begin, end) => Animation.samplers.easeOutQuart(begin, end),
    easeInOutQuart: (begin, end) => Animation.samplers.easeInOutQuart(begin, end),
    easeInQuint: (begin, end) => Animation.samplers.easeInQuint(begin, end),
    easeOutQuint: (begin, end) => Animation.samplers.easeOutQuint(begin, end),
    easeInOutQuint: (begin, end) => Animation.samplers.easeInOutQuint(begin, end),
    easeInSine: (begin, end) => Animation.samplers.easeInSine(begin, end),
    easeOutSine: (begin, end) => Animation.samplers.easeOutSine(begin, end),
    easeInOutSine: (begin, end) => Animation.samplers.easeInOutSine(begin, end),
    easeInExpo: (begin, end) => Animation.samplers.easeInExpo(begin, end),
    easeOutExpo: (begin, end) => Animation.samplers.easeOutExpo(begin, end),
    easeInOutExpo: (begin, end) => Animation.samplers.easeInOutExpo(begin, end),
    easeInCirc: (begin, end) => Animation.samplers.easeInCirc(begin, end),
    easeOutCirc: (begin, end) => Animation.samplers.easeOutCirc(begin, end),
    easeInOutCirc: (begin, end) => Animation.samplers.easeInOutCirc(begin, end),
    easeInBack: (begin, end) => Animation.samplers.easeInBack(begin, end),
    easeOutBack: (begin, end) => Animation.samplers.easeOutBack(begin, end),
    easeInOutBack: (begin, end) => Animation.samplers.easeInOutBack(begin, end),
    easeInElastic: (begin, end) => Animation.samplers.easeInElastic(begin, end),
    easeOutElastic: (begin, end) => Animation.samplers.easeOutElastic(begin, end),
    easeInOutElastic: (begin, end) => Animation.samplers.easeInOutElastic(begin, end),
    easeInBounce: (begin, end) => Animation.samplers.easeInBounce(begin, end),
    easeOutBounce: (begin, end) => Animation.samplers.easeOutBounce(begin, end),
    easeInOutBounce: (begin, end) => Animation.samplers.easeInOutBounce(begin, end),
    pingpong: (begin, end) => Animation.samplers.polyline({ keyframes: [begin, end, begin] }),
    easePingpong: (begin, end) => Animation.samplers.polybezier({ keyframes: [begin, end, begin] }),
    punch: (begin, amount) => Animation.samplers.polyline({
        keyframes: [
            begin + (amount / 5) * 4,
            begin - (amount / 5) * 3,
            begin + (amount / 5) * 2,
            begin - (amount / 5) * 1,
            begin
        ]
    }),
};

const weakmap = new WeakMap();
const degreeToRadian = Math.PI / 180;
const privates = instantiatePrivateMap();
const idTable = {};

const cancellation_tweener = Symbol('cancellationTweener');
const cancellation_cancel = Symbol('cancellationFunction');

/**
 * @typedef {Object} PFTweenEvent
 * @property {{(): void}[]} completes
 * @property {{(signal: *): void}[]} starts 
 * @property {{(signal: *): void}[]} binds 
 * @property {{(iteration: number): void}[]} loops
 * @property {{(value: PFTweenerValue): void}[]} updates 
 */

/**
 * @typedef {Object} PFTweenConfig
 * @property {PFTweenEvent} event
 * @property {number} durationMilliseconds
 * @property {number} delayMilliseconds
 * @property {number} loopCount
 * @property {boolean} mirror
 * @property {boolean} autoKill
 * @property {string} id
 * @property {ScalarSampler | ArrayOfScalarSamplers} sampler
 */

/**
 * @typedef {{(value?: any): Promise<{value: any}>}} PFTweenClip
 */

class PFTween {
    constructor(begin, end, durationMilliseconds) {
        privates(this).durationMilliseconds = durationMilliseconds;
        privates(this).starts = [];
        privates(this).completes = [];
        privates(this).updates = [];
        privates(this).monitor = [];
        privates(this).loops = [];
        privates(this).binds = [];
        privates(this).sampler = samplers.linear(toNumber(begin), toNumber(end));
    }

    static newClipCancellation(value = undefined) {
        const result = {};
        result.value = value;
        result.isRequested = false;
        result.cancel = () => result[cancellation_cancel]();
        result[cancellation_tweener] = {};
        result[cancellation_cancel] = () => { };

        return result;
    }


    /**
     * A similar function to `DOTween.To()`
     * @param {number} getter 
     * @param {{(value: PFTweenerValue): void}} setter 
     * @param {number} end 
     * @param {number} durationMilliseconds 
     */
    static to(getter, setter, end, durationMilliseconds) {
        return new PFTween(getter, end, durationMilliseconds).onStart(setter);
    }

    static hasId(id) {
        return idTable[id] != undefined;
    }

    static async kill(...ids) {
        const processes = ids.map(id => {
            if (PFTween.hasId(id)) {
                /** @type {PFTween[]} */
                const builders = idTable[id].builders;

                /** @type {PFTweener[]} */
                const tweeners = idTable[id].tweeners;

                if (tweeners && tweeners.length > 0) {
                    tweeners.forEach(tweener => {
                        privates(tweener).subscriptions.forEach(e => e.unsubscribe());
                        tweener.stop();
                    });
                }

                return nextFrameAsync(() => {
                    if (tweeners && tweeners.length > 0) {
                        tweeners.forEach(tweener => {
                            privates(tweener)['isKilled'] = true;
                            weakmap.delete(tweener);
                        });
                    }

                    if (builders && builders.length > 0) {
                        builders.forEach(builder => {
                            privates(builder)['isKilled'] = true;
                            weakmap.delete(builder);
                        });
                    }

                    idTable[id] = null;
                });
            }
        });

        await Promise.all(processes);
    }

    /**
     * Merge multiple clips into one clip. These clips play in same time.
     * @param  {PFTweenClip[]} clips 
     * @returns {PFTweenClip}
     */
    static combine(...clips) {
        clips = clips.flat();
        return result =>
            Promise.all(clips.map(i => i(result))).then(endValues =>
                Promise.resolve(result != undefined ? result : endValues)
            );
    }

    /**
     * Merge multiple clips into one clip. These clips play in sequence.
     * @param {PFTweenClip[]} clips
     * @returns {{(result?:any):Promise<{value:any}>}}
     */
    static concat(...clips) {
        clips = clips.flat();
        return result => clips.slice(1).reduce((pre, cur) => pre.then(cur), clips[0](result));
    }

    /**
     * Subscribe tween value once when the tweener start.
     * @param {{(value: PFTweenerValue) : void}} callback 
     */
    bind(callback) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).binds.push(callback);
        return this;
    }

    /**
     * Set an id to the tween, it's one-to-many.
     * @param {string | Symbol} id 
     */
    setId(id) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).id = id;
        idTable[id] = idTable[id] ? idTable[id] : {};
        idTable[id].builders = idTable[id].builders ? idTable[id].builders : [];
        idTable[id].builders.push(this);

        return this;
    }

    /**
     * If `isMirror` is not assigned, mirror animation is enabled by default.
     * @param {boolean=} isMirror 
     */
    setMirror(isMirror = true) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).isMirror = isMirror;
        return this;
    }

    /**
     * If `loopCount` is not assigned, it will be an infinite loop.
     * @param {number=} loopCount 
     */
    setLoops(loopCount = Infinity) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).loopCount = loopCount;
        return this;
    }

    setBegin(begin) {
        if (Array.isArray(privates(this).sampler)) {
            const arrOfVal = toNumbers(begin);
            for (let i = 0; i < arrOfVal.length; i++) {
                const sampler = privates(this).sampler[i];
                sampler.begin = arrOfVal[i];
            }
        } else {
            privates(this).sampler.begin = toNumber(begin);
        }
        return this;
    }

    setEnd(end) {
        if (Array.isArray(privates(this).sampler)) {
            const arrOfVal = toNumbers(end);
            for (let i = 0; i < arrOfVal.length; i++) {
                const sampler = privates(this).sampler[i];
                sampler.end = arrOfVal[i];
            }
        } else {
            privates(this).sampler.end = toNumber(end);
        }
        return this;
    }

    /**
     * @param {{(begin: number | number[], end: number | number[]): ScalarSampler | ArrayOfScalarSamplers}} ease 
     */
    setEase(ease) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        if (Array.isArray(privates(this).sampler)) {
            privates(this).sampler = ease(privates(this).sampler.map(v => v.begin), privates(this).sampler.map(v => v.end));
        } else {
            privates(this).sampler = ease(privates(this).sampler.begin, privates(this).sampler.end);
        }
        return this;
    }

    /**
     * @param {number} delayMilliseconds 
     */
    setDelay(delayMilliseconds) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).delayMilliseconds = delayMilliseconds;
        return this;
    }

    /**
     * Monitor tween value when playing.
     * @param {{(value: PFTweenerValue): void}} callback 
     */
    onUpdate(callback) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).updates.push(callback);
        return this;
    }

    /**
     * @param {{(iteration: number) : void}} callback
     */
    onLoop(callback) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).loops.push(callback);
        return this;
    }

    /**
     * Subscribe tween value everytime the tweener start.
     * @param {{(value: PFTweenerValue) : void}} callback 
     */
    onStart(callback) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).starts.push(callback);
        return this;
    }

    /**
     * @param {{() : void}} callback
     */
    onComplete(callback) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).completes.push(callback);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onStartVisible(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).starts.push(() => sceneObject.hidden = false);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onAnimatingVisibleOnly(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.onStartVisible(sceneObject);
        this.onCompleteHidden(sceneObject);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onStartHidden(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).starts.push(() => sceneObject.hidden = true);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteVisible(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).completes.push(() => sceneObject.hidden = false);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteHidden(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).completes.push(() => sceneObject.hidden = true);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject 
     */
    onCompleteResetPosition(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        const original = Reactive$1.pack3(
            sceneObject.transform.x.pinLastValue(),
            sceneObject.transform.y.pinLastValue(),
            sceneObject.transform.z.pinLastValue(),
        );

        privates(this).completes.push(() => sceneObject.transform.position = original);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteResetRotation(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        const original = {
            x: sceneObject.transform.rotationX.pinLastValue(),
            y: sceneObject.transform.rotationY.pinLastValue(),
            z: sceneObject.transform.rotationZ.pinLastValue(),
        };

        privates(this).completes.push(() => {
            sceneObject.transform.rotationX = original.x;
            sceneObject.transform.rotationY = original.y;
            sceneObject.transform.rotationZ = original.z;
        });
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteResetScale(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        const original = Reactive$1.scale(
            sceneObject.transform.scaleX.pinLastValue(),
            sceneObject.transform.scaleY.pinLastValue(),
            sceneObject.transform.scaleZ.pinLastValue(),
        );

        privates(this).completes.push(() => sceneObject.transform.scale = original);
        return this;
    }

    /**
     * Please note that this function handles in async but non-awaitable.
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteResetOpacity(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        sceneObject.getMaterial().then(mat => {
            const original = mat.opacity.pinLastValue();
            privates(this).completes.push(() => mat.opacity = original);
        }).catch(Diagnostics.log);
        return this;
    }

    setAutoKill(autoKill = true) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).autoKill = autoKill;
        privates(this).completes.push(() => weakmap.delete(this));
        return this;
    }

    apply(autoPlay = true) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        const tweener = new PFTweener({
            loopCount: privates(this).loopCount,
            mirror: privates(this).isMirror,
            durationMilliseconds: privates(this).durationMilliseconds,
            delayMilliseconds: privates(this).delayMilliseconds,
            id: privates(this).id,
            sampler: privates(this).sampler,
            autoKill: privates(this).autoKill,
            event: {
                completes: privates(this).completes,
                starts: privates(this).starts,
                loops: privates(this).loops,
                updates: privates(this).updates,
                binds: privates(this).binds,
            }
        });

        if (autoPlay) {
            tweener.start();
        }

        return tweener;
    }

    /**
     * @returns {PFTweenClip} 
     */
    get clip() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        const completePromise = result => new Promise((resolve, reject) => {
            if (result) {
                if (result[cancellation_cancel]) {
                    result[cancellation_cancel] = () => {
                        result[cancellation_tweener].stop();
                        reject({
                            message: 'canceled',
                            value: result.value,
                            lastValue: toNumber(result[cancellation_tweener].scalar),
                            lastTweener: result[cancellation_tweener]
                        });
                        result.isRequested = true;
                        return nextFrameAsync();
                    };

                    result.value = result.value ? result.value : privates(this).sampler.end;
                    privates(this).completes.push(() => resolve(result));
                } else {
                    if (result.value) {
                        privates(this).completes.push(() => resolve(result));
                    } else {
                        privates(this).completes.push(() => resolve({ value: privates(this).sampler.end }));
                    }
                }
            } else {
                privates(this).completes.push(() => { resolve({ value: privates(this).sampler.end }); });
            }
        });

        if (privates(this).loopCount == Infinity) {
            Diagnostics.log('Please note that set infinite loop will stuck the clips chain.');
        }

        return privates(this.apply(false)).getPromise(completePromise);
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    swizzle(specifier) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.apply(true).swizzle(specifier);
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    get scalar() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.apply().scalar;
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    get pack2() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.apply().pack2;
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    get pack3() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.apply().pack3;
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    get scale() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.pack3;
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    get pack4() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.apply().pack4;
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    get rotation() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.deg2rad;
    }

    /**
     * Play once, then auto kills itself after complete.
     */
    get deg2rad() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        this.setAutoKill();
        return this.apply().deg2rad;
    }
}

class PFTweenerValue {
    constructor(rawValue, isArray) {
        this.rawValue = rawValue;
        this.isArraySamplers = isArray;
    }

    swizzle(specifier) {
        return swizzle(this.rawValue, specifier);
    }

    /** @returns {ScalarSignal} */
    get scalar() {
        return this.swizzle('x');
    }

    /** @returns {Point2DSignal} */
    get pack2() {
        if (this.isArraySamplers) {
            return this.swizzle('xy');
        } else {
            return this.swizzle('xx');
        }
    }

    /** @returns {PointSignal} */
    get pack3() {
        if (this.isArraySamplers) {
            return this.swizzle('xyz');
        } else {
            return this.swizzle('xxx');
        }
    }

    /** @returns {Point4DSignal} */
    get pack4() {
        if (this.isArraySamplers) {
            return this.swizzle('xyzw');
        } else {
            return this.swizzle('xxxx');
        }
    }

    /** @returns {ScalarSignal} */
    get deg2rad() {
        return this.scalar.mul(degreeToRadian);
    }

    get rotation() {
        return this.deg2rad;
    }
}

class PFTweener extends PFTweenerValue {
    /**
     * @param {PFTweenConfig} config 
     */
    constructor(config) {
        const driver = Animation.timeDriver({ durationMilliseconds: config.durationMilliseconds, loopCount: config.loopCount, mirror: config.mirror });
        const signal = Animation.animate(driver, config.sampler);
        super(signal, Array.isArray(config.sampler));

        if (config.id) {
            idTable[config.id].tweeners = idTable[config.id].tweeners ? idTable[config.id].tweeners : [];
            idTable[config.id].tweeners.push(this);
        }

        if (config.autoKill) {
            config.event.completes.push(() => {
                privates(this).subscriptions.forEach(e => e.unsubscribe());
                weakmap.delete(this);
            });
        }

        /** @type {Subscription[]} */
        privates(this).subscriptions = [];
        privates(this).config = config;
        privates(this).driver = driver;
        privates(this).signal = signal;
        privates(this).hadBinded = false;
        privates(this).isArraySamplers = Array.isArray(config.sampler);
        privates(this).subscriptions.push(driver.onCompleted().subscribe(() => invoke(config.event.completes)));
        privates(this).subscriptions.push(driver.onAfterIteration().subscribe(index => invoke(config.event.loops, index)));
        privates(this).getPromise = promise => result => {
            if (result && result[cancellation_tweener]) {
                result[cancellation_tweener] = this;
            }

            this.replay();
            return promise(result);
        };

        if (Array.isArray(config.sampler)) {
            const signals = {};

            for (let i = 0; i < config.sampler.length; i++) {
                let propName;

                switch (i) {
                    case 0: propName = 'x'; break;
                    case 1: propName = 'y'; break;
                    case 2: propName = 'z'; break;
                    case 3: propName = 'w'; break;
                }

                signals[propName] = signal[i];
            }

            const subscription = Reactive$1.monitorMany(signals)
                .select('newValues')
                .subscribe(values => invoke(
                    config.event.updates,
                    new PFTweenerValue(values, privates(this).isArraySamplers)
                ));

            privates(this).subscriptions.push(subscription);

        } else {
            const subscription = signal.monitor()
                .select('newValue')
                .subscribe(value => invoke(
                    config.event.updates,
                    new PFTweenerValue(value, privates(this).isArraySamplers)
                ));

            privates(this).subscriptions.push(subscription);
        }
    }

    replay() {
        this.reset();
        this.start();
    }

    reset() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        privates(this).driver.reset();
    }

    reverse() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        privates(this).driver.reverse();
    }

    start() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        const start = () => {
            if (!privates(this).hadBinded) {
                privates(this).hadBinded = true;
                invoke(privates(this).config.event.binds, new PFTweenerValue(privates(this).signal, privates(this).isArraySamplers));
            }

            invoke(privates(this).config.event.starts, new PFTweenerValue(privates(this).signal, privates(this).isArraySamplers));
            privates(this).driver.start();
        };

        if (privates(this).config.delayMilliseconds !== undefined) {
            const subscription = Time$1.setTimeout(() => start(), privates(this).config.delayMilliseconds);
            privates(this).subscriptions.push(subscription);

        } else {
            start();
        }
    }

    stop() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        privates(this).driver.stop();
    }

    /**
     * @returns {BoolSignal}
     */
    isRunning() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        return privates(this).driver.isRunning();
    }
}

function invoke(calls, arg) {
    for (let i = 0; i < calls.length; i++) {
        calls[i](arg);
    }
}

function instantiatePrivateMap() {
    return obj => {
        let props = weakmap.get(obj);
        if (!props) {
            props = {};
            weakmap.set(obj, props);
        }
        return props;
    };
}

export { samplers as Ease, PFTween };
