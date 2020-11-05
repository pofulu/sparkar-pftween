import { nextFrameAsync } from './Invoke';
import { swizzle, toNumber } from './ReactiveUtility';

const Animation = require('Animation');
const Reactive = require('Reactive');
const Time = require('Time');
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

class PFTween {
    constructor(begin, end, durationMilliseconds) {
        privates(this).duration = durationMilliseconds;
        privates(this).start = [];
        privates(this).complete = [];
        privates(this).update = [];
        privates(this).monitor = [];
        privates(this).loop = [];
        privates(this).sampler = samplers.linear(toNumber(begin), toNumber(end));
    }

    static newClipCancellation(value = undefined) {
        let result = {};
        result.value = value;
        result.cancel = () => result[cancellation_cancel]();
        result[cancellation_tweener] = {};
        result[cancellation_cancel] = () => { };

        return result;
    }

    /**
     * @param {{(tweener: PFTweener) : void}} setter
     */
    static To(getter, setter, end, durationMilliseconds) {
        return new PFTween(getter, end, durationMilliseconds).bind(setter);
    }

    static async kill(...ids) {
        const processes = ids.map(id => {
            if (privates(idTable)[id] != undefined) {
                /** @type {PFTween} */
                const builder = privates(idTable)[id].builder;

                /** @type {PFTweener} */
                const tweener = privates(idTable)[id].tweener;

                if (tweener) {
                    tweener.getMonitorSubscription().unsubscribe();
                    tweener.stop();
                }

                return nextFrameAsync(() => {
                    weakmap.delete(tweener);
                    weakmap.delete(builder);
                    privates(idTable)[id] = null;

                    if (tweener) {
                        Object.getPrototypeOf(tweener).isKilled = true;
                    }

                    if (builder) {
                        Object.getPrototypeOf(builder).isKilled = true;
                    }
                });
            }
        })

        await Promise.all(processes);
    }

    /**
     * @param  {...any} clips 
     * @returns {{(result?:any):Promise<{value:any}>}}
     */
    static combine(...clips) {
        clips = clips.flat();
        return result =>
            Promise.all(clips.map(i => i(result))).then(endValues =>
                Promise.resolve(result != undefined ? result : endValues)
            );
    }

    /**
     * @returns {{(result?:any):Promise<{value:any}>}}
     */
    static concat(...clips) {
        clips = clips.flat();
        return result => {
            return clips.slice(1).reduce((pre, cur) => pre.then(cur), clips[0](result));
        }
    }

    setId(id) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).id = id;
        privates(idTable)[id] = {};
        privates(idTable)[id].name = id;
        privates(idTable)[id].builder = this;
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
        privates(this).sampler.begin = toNumber(begin);
        return this;
    }

    setEnd(end) {
        privates(this).sampler.end = toNumber(end);
        return this;
    }

    /**
     * @param {{(begin: number, end: number):ScalarSampler}} ease 
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

        privates(this).delay = delayMilliseconds;
        return this;
    }

    /**
     * @param {{(tweener: PFTweener) : void}} call 
     */
    bind(call) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).update.push(call);
        return this;
    }

    /**
     * @param {{(value: PFTweenerValue): void}} call 
     */
    onUpdate(call) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).monitor.push(call);
        return this;
    }

    /**
     * @param {{(iteration: number) : void}} call
     */
    onLoop(call) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).loop.push(call);
        return this;
    }

    /**
     * @param {{() : void}} call
     */
    onStart(call) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).start.push(call);
        return this;
    }

    /**
     * @param {{() : void}} call
     */
    onComplete(call) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).complete.push(call);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onStartVisible(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).start.push(() => sceneObject.hidden = false);
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

        privates(this).start.push(() => sceneObject.hidden = true);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteVisible(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).complete.push(() => sceneObject.hidden = false);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteHidden(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        privates(this).complete.push(() => sceneObject.hidden = true);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject 
     */
    onCompleteResetPosition(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        const original = Reactive.pack3(
            sceneObject.transform.x.pinLastValue(),
            sceneObject.transform.y.pinLastValue(),
            sceneObject.transform.z.pinLastValue(),
        );

        privates(this).complete.push(() => sceneObject.transform.position = original);
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

        privates(this).complete.push(() => {
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

        const original = Reactive.scale(
            sceneObject.transform.scaleX.pinLastValue(),
            sceneObject.transform.scaleY.pinLastValue(),
            sceneObject.transform.scaleZ.pinLastValue(),
        );

        privates(this).complete.push(() => sceneObject.transform.scale = original);
        return this;
    }

    /**
     * Please note that this can only be used on `SceneObject` containing material property.
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteResetOpacity(sceneObject) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        sceneObject.getMaterial().then(mat => {
            const original = mat.opacity.pinLastValue();
            privates(this).complete.push(() => mat.opacity = original);
        }).catch(Diagnostics.log)
        return this;
    }

    apply(autoPlay = true) {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        const tweener = animate(privates(this), autoPlay);
        weakmap.delete(this);
        return tweener;
    }

    /**
     * @returns {{(value?:any):Promise<{value:any}>}}
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
                        return nextFrameAsync();
                    }

                    result.value = result.value ? result.value : privates(this).sampler.end;
                    privates(this).complete.push(() => resolve(result))
                } else {
                    if (result.value) {
                        privates(this).complete.push(() => resolve(result))
                    } else {
                        privates(this).complete.push(() => resolve({ value: privates(this).sampler.end }))
                    }
                }
            } else {
                privates(this).complete.push(() => resolve({ value: privates(this).sampler.end }))
            }
        });

        if (privates(this).loopCount == Infinity) {
            Diagnostics.log('Please note that set infinite loop will stuck the clips chain.');
        }

        const tweener = animate(privates(this), false);
        return privates(tweener).getPromise(completePromise);
    }

    get swizzle() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        return this.apply(true).swizzle;
    }

    get log() {
        if (this['isKilled']) {
            throw new Error('This PFTween has been killed.');
        }

        return privates(this)
    }

    get scalar() {
        return this.apply(true).scalar;
    }

    get pack2() {
        return this.apply(true).pack2;
    }

    get pack3() {
        return this.apply(true).pack3;
    }

    get scale() {
        return this.pack3;
    }

    get pack4() {
        return this.apply(true).pack4;
    }

    get rotation() {
        return this.d2r;
    }

    get d2r() {
        return this.apply(true).rotation;
    }
}

class PFTweenerValue {
    constructor(rawValue, isArray) {
        this.rawValue = rawValue;
        privates(this).isArray = isArray;
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
        if (privates(this).isArray) {
            return this.swizzle('xy');
        } else {
            return this.swizzle('xx');
        }
    }

    /** @returns {PointSignal} */
    get pack3() {
        if (privates(this).isArray) {
            return this.swizzle('xyz');
        } else {
            return this.swizzle('xxx');
        }
    }

    /** @returns {Point4DSignal} */
    get pack4() {
        if (privates(this).isArray) {
            return this.swizzle('xyzw');
        } else {
            return this.swizzle('xxxx');
        }
    }

    /** @returns {ScalarSignal} */
    get d2r() {
        return this.scalar.mul(degreeToRadian);
    }
}

class PFTweener {
    constructor(driver, sampler, animate, delay, start, update, monitor, id) {
        if (id) {
            privates(idTable)[id].tweener = this;
        }

        privates(this).delay = delay;
        privates(this).animate = animate;
        privates(this).sampler = sampler;
        privates(this).driver = driver;
        privates(this).onStart = start;
        privates(this).onUpdate = update;
        privates(this).onMonitor = monitor;
        privates(this).hasBinded = false;
        privates(this).isArray = Array.isArray(sampler);
        privates(this).getPromise = promise => result => {
            if (this['isKilled']) {
                throw new Error('This PFTweener has been killed.')
            }

            if (result && result[cancellation_tweener]) {
                result[cancellation_tweener] = this;
            }

            this.replay();
            return promise(result);
        }
    }

    /**
     * @returns {Subscription}
     */
    getMonitorSubscription() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        return privates(this).monitorSubscription;
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

        const play = () => {
            invoke(privates(this).onStart);

            if (!privates(this).hasBinded) {
                invoke(privates(this).onUpdate, this);
                privates(this).hasBinded = true;

                if (privates(this).samplerLength > 0) {
                    let signal = {};
                    for (let i = 0; i < privates(this).samplerLength; i++) {
                        let propName;
                        switch (i) {
                            case 0: propName = 'x'; break;
                            case 1: propName = 'y'; break;
                            case 2: propName = 'z'; break;
                            case 3: propName = 'w'; break;
                        }
                        signal[propName] = privates(this).animate[i];
                    }
                    privates(this).monitorSubscription = Reactive.monitorMany(signal).select('newValues').subscribe(values => invoke(privates(this).onMonitor, new PFTweenerValue(values, privates(this).isArray)));
                } else {
                    privates(this).monitorSubscription = privates(this).animate.monitor().select('newValue').subscribe(value => invoke(privates(this).onMonitor, new PFTweenerValue(value, privates(this).isArray)));
                }
            }

            privates(this).driver.start();
        }

        if (privates(this).delay != undefined) {
            Time.setTimeout(play, privates(this).delay);
        } else {
            play();
        }
    }

    stop() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        privates(this).driver.stop();
    }

    swizzle(specifier) {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        return swizzle(privates(this).animate, specifier);
    }

    /**@returns {BoolSignal} */
    get isRunning() {
        if (this['isKilled']) {
            throw new Error('This PFTweener has been killed.')
        }

        return privates(this).driver.isRunning();
    }

    /**@returns {ScalarSignal} */
    get scalar() {
        return this.swizzle('x');
    }

    /**@returns {Point2DSignal} */
    get pack2() {
        if (privates(this).isArray) {
            return this.swizzle('xy');
        } else {
            return this.swizzle('xx');
        }
    }

    /**@returns {PointSignal} */
    get scale() {
        return this.pack3;
    }

    /**@returns {PointSignal} */
    get pack3() {
        if (privates(this).isArray) {
            return this.swizzle('xyz');
        } else {
            return this.swizzle('xxx');
        }
    }

    /**@returns {Point4DSignal} */
    get pack4() {
        if (privates(this).isArray) {
            return this.swizzle('xyzw');
        } else {
            return this.swizzle('xxxx');
        }
    }

    /**@returns {ScalarSignal} convert degree to radian*/
    get rotation() {
        return this.d2r;
    }

    /**@returns {ScalarSignal} convert degree to radian*/
    get d2r() {
        const scalar = this.scalar
        return scalar.mul(degreeToRadian);
    }
}

function animate(config, autoPlay) {
    const driver = Animation.timeDriver({
        durationMilliseconds: config.duration,
        loopCount: config.loopCount,
        mirror: config.isMirror
    });

    driver.onCompleted().subscribe(() => invoke(config.complete));
    driver.onAfterIteration().subscribe(index => invoke(config.loop, index));

    const animate = Animation.animate(driver, config.sampler);
    const tweener = new PFTweener(
        driver,
        config.sampler,
        animate,
        config.delay,
        config.start,
        config.update,
        config.monitor,
        config.id,
    );

    if (autoPlay) tweener.start();
    return tweener;
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

export { PFTween, samplers as Ease };