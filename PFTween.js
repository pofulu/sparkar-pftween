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
    punch: (begin, amount) => Animation.samplers.polyline({
        keyframes: [
            begin + (amount / 5) * 4,
            begin - (amount / 5) * 3,
            begin + (amount / 5) * 2,
            begin - (amount / 5) * 1,
            begin
        ]
    }),
    pingpong: (begin, end) => Animation.samplers.polyline({ keyframes: [begin, end, begin] }),
    easePingpong: (begin, end) => Animation.samplers.polybezier({ keyframes: [begin, end, begin] }),
};

const degreeToRadian = Math.PI / 180;
const privates = instantiatePrivateMap();

const cancellation_tweener = Symbol('cancellationTweener');
const cancellation_cancel = Symbol('cancellationFunction');

class PFTween {
    constructor(begin, end, durationMilliseconds) {
        privates(this).duration = durationMilliseconds;
        privates(this).start = [];
        privates(this).complete = [];
        privates(this).update = [];
        privates(this).loop = [];
        privates(this).sampler = samplers.linear(
            typeof begin.pinLastValue === 'function' ? begin.pinLastValue() : begin,
            typeof end.pinLastValue === 'function' ? end.pinLastValue() : end
        );
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

    /**
     * @param  {...any} clips 
     * @returns {{(result?:any):Promise<{value:any}>}}
     */
    static combine(...clips) {
        clips = clips.flat();
        return result =>
            Promise.all(clips.map(i => i())).then(endValues =>
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

    /**
     * If `isMirror` is not assigned, mirror animation is enabled by default.
     * @param {boolean=} isMirror 
     */
    setMirror(isMirror = true) {
        privates(this).isMirror = isMirror;
        return this;
    }

    /**
     * If `loopCount` is not assigned, it will be an infinite loop.
     * @param {number=} loopCount 
     */
    setLoops(loopCount = Infinity) {
        privates(this).loopCount = loopCount;
        return this;
    }

    setBegin(number) {
        privates(this).sampler.begin = typeof number.pinLastValue === 'function' ? number.pinLastValue() : number;
        return this;
    }

    setEnd(number) {
        privates(this).sampler.end = typeof number.pinLastValue === 'function' ? number.pinLastValue() : number;
        return this;
    }

    /**
     * @param {{(begin: number, end: number):ScalarSampler}} ease 
     */
    setEase(ease) {
        privates(this).sampler = ease(privates(this).sampler.begin, privates(this).sampler.end);
        return this;
    }

    /**
     * @param {number} delayMilliseconds 
     */
    setDelay(delayMilliseconds) {
        privates(this).delay = delayMilliseconds;
        return this;
    }

    /**
     * @param {{(tweener: PFTweener) : void}} call 
     */
    bind(call) {
        privates(this).update.push(call);
        return this;
    }

    /**
     * @param {{(iteration: number) : void}} call
     */
    onLoop(call) {
        privates(this).loop.push(call);
        return this;
    }

    /**
     * @param {{() : void}} call
     */
    onStart(call) {
        privates(this).start.push(call);
        return this;
    }

    /**
     * @param {{() : void}} call
     */
    onComplete(call) {
        privates(this).complete.push(call);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onStartVisible(sceneObject) {
        privates(this).start.push(() => sceneObject.hidden = Reactive.val(false));
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onAnimatingVisibleOnly(sceneObject) {
        this.onStartVisible(sceneObject);
        this.onCompleteHidden(sceneObject);
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onStartHidden(sceneObject) {
        privates(this).start.push(() => sceneObject.hidden = Reactive.val(true));
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteVisible(sceneObject) {
        privates(this).complete.push(() => sceneObject.hidden = Reactive.val(false));
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject
     */
    onCompleteHidden(sceneObject) {
        privates(this).complete.push(() => sceneObject.hidden = Reactive.val(true));
        return this;
    }

    /**
     * @param {SceneObjectBase} sceneObject 
     */
    onCompleteResetPosition(sceneObject) {
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
        const original = sceneObject.material.opacity.pinLastValue();
        privates(this).complete.push(() => sceneObject.material.opacity = original);
        return this;
    }

    apply(autoPlay = true) {
        return animate(privates(this), autoPlay);
    }

    /**
     * @returns {{(value?:any):Promise<{value:any}>}}
     */
    get clip() {
        const completePromise = result => new Promise((resolve, reject) => {
            if (result) {
                if (result[cancellation_cancel]) {
                    result[cancellation_cancel] = () => {
                        result[cancellation_tweener].stop();
                        reject({
                            message: 'canceled',
                            value: result.value,
                            lastValue: result[cancellation_tweener].scalar.pinLastValue(),
                            lastTweener: result[cancellation_tweener]
                        });
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

        const tweener = this.apply(false);
        return privates(tweener).getPromise(completePromise);
    }

    get log() {
        return privates(this)
    }

    get scalar() {
        return this.apply(true).scalar;
    }

    get scale() {
        return this.apply(true).scale;
    }

    get pack2() {
        return this.apply(true).pack2;
    }

    get pack3() {
        return this.apply(true).pack3;
    }

    get pack4() {
        return this.apply(true).pack4;
    }

    get rotation() {
        return this.apply(true).rotation;
    }
}

class PFTweener {
    constructor(driver, animate, delay, start, update) {
        privates(this).delay = delay;
        privates(this).animate = animate;
        privates(this).driver = driver;
        privates(this).onStart = start;
        privates(this).onUpdate = update;
        privates(this).hasBinded = false;
        privates(this).getPromise = promise => result => {
            if (result && result[cancellation_tweener]) {
                result[cancellation_tweener] = this;
            }
            this.replay();
            return promise(result);
        }
    }

    replay() {
        this.reset();
        this.start();
    }

    reset() {
        privates(this).driver.reset();
    }

    reverse() {
        privates(this).driver.reverse();
    }

    start() {
        const play = () => {
            invoke(privates(this).onStart);
            
            if (!privates(this).hasBinded){
                invoke(privates(this).onUpdate, this);
                privates(this).hasBinded =true;
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
        privates(this).driver.stop();
    }

    /**@returns {BoolSignal} */
    get isRunning() {
        return privates(this).driver.isRunning();
    }

    /**@returns {ScalarSignal} */
    get scalar() {
        return privates(this).animate;
    }

    /**@returns {ScaleSignal} */
    get scale() {
        const scalar = this.scalar;
        return Reactive.scale(scalar, scalar, scalar);
    }

    /**@returns {Point2DSignal} */
    get pack2() {
        const scalar = this.scalar
        return Reactive.pack2(scalar, scalar);
    }

    /**@returns {PointSignal} */
    get pack3() {
        const scalar = this.scalar
        return Reactive.pack3(scalar, scalar, scalar);
    }

    /**@returns {Point4DSignal} */
    get pack4() {
        const scalar = this.scalar
        return Reactive.pack4(scalar, scalar, scalar, scalar);
    }

    /**@returns {ScalarSignal} convert degree to radian*/
    get rotation() {
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
    const tweener = new PFTweener(driver, animate, config.delay, config.start, config.update);

    if (autoPlay) tweener.start();

    return tweener;
}

function invoke(calls, arg) {
    for (let i = 0; i < calls.length; i++) {
        calls[i](arg);
    }
}

function instantiatePrivateMap() {
    const map = new WeakMap();
    return obj => {
        let props = map.get(obj);
        if (!props) {
            props = {};
            map.set(obj, props);
        }
        return props;
    };
}

export { PFTween, samplers as Ease };