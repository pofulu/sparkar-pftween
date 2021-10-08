"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PFTween = exports.Ease = void 0;
const Time_1 = __importDefault(require("Time"));
const Animation_1 = __importDefault(require("Animation"));
const Reactive_1 = __importDefault(require("Reactive"));
const Patches_1 = __importDefault(require("Patches"));
const samplers = {
    linear: Animation_1.default.samplers.linear,
    easeInQuad: Animation_1.default.samplers.easeInQuad,
    easeOutQuad: Animation_1.default.samplers.easeOutQuad,
    easeInOutQuad: Animation_1.default.samplers.easeInOutQuad,
    easeInCubic: Animation_1.default.samplers.easeInCubic,
    easeOutCubic: Animation_1.default.samplers.easeOutCubic,
    easeInOutCubic: Animation_1.default.samplers.easeInOutCubic,
    easeInQuart: Animation_1.default.samplers.easeInQuart,
    easeOutQuart: Animation_1.default.samplers.easeOutQuart,
    easeInOutQuart: Animation_1.default.samplers.easeInOutQuart,
    easeInQuint: Animation_1.default.samplers.easeInQuint,
    easeOutQuint: Animation_1.default.samplers.easeOutQuint,
    easeInOutQuint: Animation_1.default.samplers.easeInOutQuint,
    easeInSine: Animation_1.default.samplers.easeInSine,
    easeOutSine: Animation_1.default.samplers.easeOutSine,
    easeInOutSine: Animation_1.default.samplers.easeInOutSine,
    easeInExpo: Animation_1.default.samplers.easeInExpo,
    easeOutExpo: Animation_1.default.samplers.easeOutExpo,
    easeInOutExpo: Animation_1.default.samplers.easeInOutExpo,
    easeInCirc: Animation_1.default.samplers.easeInCirc,
    easeOutCirc: Animation_1.default.samplers.easeOutCirc,
    easeInOutCirc: Animation_1.default.samplers.easeInOutCirc,
    easeInBack: Animation_1.default.samplers.easeInBack,
    easeOutBack: Animation_1.default.samplers.easeOutBack,
    easeInOutBack: Animation_1.default.samplers.easeInOutBack,
    easeInElastic: Animation_1.default.samplers.easeInElastic,
    easeOutElastic: Animation_1.default.samplers.easeOutElastic,
    easeInOutElastic: Animation_1.default.samplers.easeInOutElastic,
    easeInBounce: Animation_1.default.samplers.easeInBounce,
    easeOutBounce: Animation_1.default.samplers.easeOutBounce,
    easeInOutBounce: Animation_1.default.samplers.easeInOutBounce,
    linearPingPong: (begin, end) => Animation_1.default.samplers.polyline({ keyframes: [begin, end, begin] }),
    easePingPong: (begin, end) => Animation_1.default.samplers.polybezier({ keyframes: [begin, end, begin] }),
    punch: (begin, amount) => {
        if (Array.isArray(begin) && Array.isArray(amount)) {
            return Animation_1.default.samplers.polybezier({
                keyframes: [
                    [begin[0] + (amount[0] / 5) * 4, begin[1] + (amount[1] / 5) * 4, begin[2] + (amount[2] / 5) * 4],
                    [begin[0] - (amount[0] / 5) * 3, begin[1] - (amount[1] / 5) * 3, begin[2] - (amount[2] / 5) * 3],
                    [begin[0] + (amount[0] / 5) * 2, begin[1] + (amount[1] / 5) * 2, begin[2] + (amount[2] / 5) * 2],
                    [begin[0] - (amount[0] / 5) * 1, begin[1] - (amount[1] / 5) * 1, begin[2] - (amount[2] / 5) * 1],
                    [begin[0], begin[1], begin[2]]
                ]
            });
        }
        else {
            return Animation_1.default.samplers.polybezier({
                keyframes: [
                    begin + (amount / 5) * 4,
                    begin - (amount / 5) * 3,
                    begin + (amount / 5) * 2,
                    begin - (amount / 5) * 1,
                    begin
                ]
            });
        }
    },
};
exports.Ease = samplers;
const degreeToRadian = 0.0174532925;
const PFTweenManager = new class {
    constructor() {
        this.table = {};
    }
    onKill(id, callback) {
        if (this.table[id] == undefined) {
            this.table[id] = [];
        }
        this.table[id].push(callback);
    }
    kill(id) {
        if (this.table[id] != undefined) {
            this.table[id].forEach(callback => callback());
            delete this.table[id];
        }
    }
    hasId(id) {
        return this.table[id] != undefined;
    }
};
class PFTweenEvent {
    constructor() {
        this._events = [];
    }
    get events() {
        return this._events;
    }
    invoke(arg) {
        if (this._events.length > 0) {
            for (let i = 0; i < this._events.length; i++) {
                this._events[i](arg);
            }
        }
        ;
    }
    invokeOnMonitor(signal) {
        if (this._events.length == 0) {
            return;
        }
        if (Array.isArray(signal)) {
            let list = {};
            for (let i = 0; i < signal.length; i++) {
                list[i] = signal[i];
            }
            this._subscription = Reactive_1.default.monitorMany(list, { fireOnInitialValue: true }).subscribe(values => this.invoke(Object.values(values.newValues)));
        }
        else {
            this._subscription = signal.monitor({ fireOnInitialValue: true }).select('newValue').subscribe(value => this.invoke(value));
        }
    }
    invokeOnEvent(eventSource) {
        if (this._events.length > 0) {
            this._subscription = eventSource.subscribe(value => this.invoke(value));
        }
    }
    add(callback) {
        this._events.push(callback);
    }
    dispose() {
        if (this._subscription != undefined) {
            this._subscription.unsubscribe();
            this._subscription = undefined;
        }
        this._events = [];
    }
}
class PFTweenEvents {
    constructor() {
        this.onStart = new PFTweenEvent();
        this.onComplete = new PFTweenEvent();
        this.onLoop = new PFTweenEvent();
        this.onUpdate = new PFTweenEvent();
        this.onFinally = new PFTweenEvent();
    }
    dispose() {
        this.onStart.dispose();
        this.onComplete.dispose();
        this.onLoop.dispose();
        this.onUpdate.dispose();
        this.onFinally.dispose();
    }
}
class PFTweenClipCancellation {
    constructor(value) {
        this.value = value;
    }
    cancel() { }
}
function instanceOfICurveProvider(object) {
    return 'evaluate' in object;
}
class PFTween {
    constructor(begin, end, durationMilliseconds) {
        begin = toNumber(begin);
        end = toNumber(end);
        this.config = {
            loopCount: undefined,
            isMirror: false,
            durationMilliseconds: durationMilliseconds,
            delayMilliseconds: 0,
            events: new PFTweenEvents(),
            id: undefined,
            useCustomCurve: false,
            curve: undefined,
            begin: begin,
            end: end,
            sampler: samplers.linear(begin, end),
        };
    }
    static combine(...clips) {
        clips = clips.flat();
        return value => Promise.all(clips.map(i => i(value))).then(endValues => Promise.resolve(value != undefined ? value : endValues));
    }
    static concat(...clips) {
        clips = clips.flat();
        return value => clips.slice(1).reduce((pre, cur) => pre.then(cur), clips[0](value));
    }
    static combineProgress(...progresses) {
        progresses = progresses.flat();
        const max = Math.max(...progresses.map(pftween => pftween.durationMilliseconds));
        return {
            get durationMilliseconds() { return max; },
            setProgress(progress) {
                for (let i = 0; i < progresses.length; i++) {
                    const tween = progresses[i];
                    tween.setProgress(Reactive_1.default.fromRange(progress, 0, tween.durationMilliseconds / max));
                }
            }
        };
    }
    static concatProgerss(...progresses) {
        progresses = progresses.flat();
        return PFTween.concatProgress(progresses);
    }
    static concatProgress(...progresses) {
        progresses = progresses.flat();
        const total = progresses
            .map(pftween => pftween.durationMilliseconds)
            .reduce((pre, cur) => pre + cur, 0);
        return {
            get durationMilliseconds() { return total; },
            setProgress(progress) {
                let start = 0;
                let startTimings = [0];
                for (let i = 0; i < progresses.length; i++) {
                    startTimings.push(start + progresses[i].durationMilliseconds / total);
                }
                for (let i = progresses.length - 1; i >= 0; i--) {
                    const tween = progresses[i];
                    start = startTimings[i];
                    const end = start + tween.durationMilliseconds / total;
                    tween.setProgress(Reactive_1.default.fromRange(progress, start, end));
                }
            }
        };
    }
    /**
     * Stop and unsubscribe all events of the animation.
     * @param id The id you set for to your animation.
     */
    static kill(id) {
        PFTweenManager.kill(id);
    }
    /**
     * Check if the animation of this id exist.
     * @param id
     * @returns
     */
    static hasId(id) {
        return PFTweenManager.hasId(id);
    }
    /**
     * Create a cancellation used for interrupt clips.
     * @param value The args you want to pass to clip.
     * @returns
     */
    static newClipCancellation(value) {
        return new PFTweenClipCancellation(value);
    }
    setEase() {
        if (arguments.length == 1 && instanceOfICurveProvider(arguments[0])) {
            this.config.useCustomCurve = true;
            this.config.curve = arguments[0];
            this.config.sampler = undefined;
        }
        else if (arguments.length == 1) {
            this.config.useCustomCurve = false;
            this.config.curve = undefined;
            this.config.sampler = arguments[0](this.config.begin, this.config.end);
        }
        return this;
    }
    setLoops() {
        if (arguments.length == 0) {
            this.config.loopCount = Infinity;
        }
        else if (arguments.length == 1 && typeof arguments[0] == 'boolean') {
            this.config.loopCount = Infinity;
            this.config.isMirror = arguments[0];
        }
        else if (arguments.length == 1 && typeof arguments[0] == 'number') {
            this.config.loopCount = arguments[0];
        }
        else if (arguments.length == 2 && typeof arguments[0] == 'number' && typeof arguments[1] == 'boolean') {
            this.config.loopCount = arguments[0];
            this.config.isMirror = arguments[1];
        }
        return this;
    }
    setMirror(isMirror = true) {
        this.config.isMirror = isMirror;
        return this;
    }
    /**
     * Delay to start animation, this will only delay the first time.
     */
    setDelay(delayMilliseconds) {
        this.config.delayMilliseconds = delayMilliseconds;
        return this;
    }
    setId(id) {
        this.config.id = id;
        return this;
    }
    setAutoKill() {
        if (this.config.id == undefined) {
            this.setId(Symbol());
        }
        this.config.events.onFinally.add(() => PFTweenManager.kill(this.config.id));
        return this;
    }
    onStart(callback) {
        this.config.events.onStart.add(callback);
        return this;
    }
    onComplete(callback) {
        this.config.events.onComplete.add(callback);
        return this;
    }
    onUpdate(callback) {
        this.config.events.onUpdate.add(callback);
        return this;
    }
    onLoop(callback) {
        this.config.events.onLoop.add(callback);
        return this;
    }
    onStartVisible(sceneObject) {
        this.onStart(() => sceneObject.hidden = Reactive_1.default.val(false));
        return this;
    }
    onAnimatingVisibleOnly(sceneObject) {
        this.onStartVisible(sceneObject);
        this.onCompleteHidden(sceneObject);
        return this;
    }
    onStartHidden(sceneObject) {
        this.onStart(() => sceneObject.hidden = Reactive_1.default.val(true));
        return this;
    }
    onCompleteVisible(sceneObject) {
        this.onComplete(() => sceneObject.hidden = Reactive_1.default.val(false));
        return this;
    }
    onCompleteHidden(sceneObject) {
        this.onComplete(() => sceneObject.hidden = Reactive_1.default.val(true));
        return this;
    }
    onCompleteResetPosition(sceneObject) {
        const original = Reactive_1.default.pack3(sceneObject.transform.x.pinLastValue(), sceneObject.transform.y.pinLastValue(), sceneObject.transform.z.pinLastValue());
        this.onComplete(() => sceneObject.transform.position = original);
        return this;
    }
    onCompleteResetRotation(sceneObject) {
        const original = {
            x: sceneObject.transform.rotationX.pinLastValue(),
            y: sceneObject.transform.rotationY.pinLastValue(),
            z: sceneObject.transform.rotationZ.pinLastValue(),
        };
        this.onComplete(() => {
            sceneObject.transform.rotationX = original.x;
            sceneObject.transform.rotationY = original.y;
            sceneObject.transform.rotationZ = original.z;
        });
        return this;
    }
    onCompleteResetScale(sceneObject) {
        const original = Reactive_1.default.scale(sceneObject.transform.scaleX.pinLastValue(), sceneObject.transform.scaleY.pinLastValue(), sceneObject.transform.scaleZ.pinLastValue());
        this.onComplete(() => sceneObject.transform.scale = original);
        return this;
    }
    onCompleteResetOpacity(material) {
        const original = material.opacity.pinLastValue();
        this.onComplete(() => material.opacity = original);
        return this;
    }
    /**
     * @deprecated Please use `onStart(callback)` instead. The callback of `onStart` receive the tween value. `bind` is equivalent to `onStart` now.
     */
    bind(callback) {
        this.onStart(callback);
        return this;
    }
    /**
     * @deprecated Please use `build()` instead. `apply` is equivalent to `build` now.
     */
    apply(autoPlay = true) {
        return this.build(autoPlay);
    }
    build(autoPlay = true) {
        const tweener = new PFTweener(this.config);
        if (autoPlay) {
            tweener.start();
        }
        return tweener;
    }
    /**
     * Take input numbers and output them in a different order.
     * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1).
     */
    swizzle(specifier) {
        return this.setAutoKill().build().swizzle(specifier);
    }
    /**
     * Convert
     * @param name
     * @returns
     */
    patch(name) { return this.setAutoKill().build().patch(name); }
    /**
     * Get an evaluable animation controller.
     * Please note that the `onCompleteEvent`, `onStartEvent`, `onLoopEvent` won't work.
     */
    get progress() {
        this.config.events.onComplete.dispose();
        this.config.events.onStart.dispose();
        this.config.events.onLoop.dispose();
        return new PFTweenProgress(this.config);
    }
    get clip() {
        let promiseResolve, resolveResult;
        this.onComplete(() => promiseResolve(resolveResult && (resolveResult.value || resolveResult.cancel) ? resolveResult : { value: resolveResult }));
        const tweener = this.build(false);
        return result => new Promise((resolve, reject) => {
            PFTweenManager.onKill(this.config.id, () => reject(`PFTween killed: ${String(this.config.id)}`));
            resolveResult = result;
            promiseResolve = resolve;
            tweener.replay();
            if (result instanceof PFTweenClipCancellation) {
                result.cancel = () => {
                    tweener.stop();
                    reject('PFTween clip canceled');
                };
            }
        });
    }
    get scalar() { return this.setAutoKill().build().scalar; }
    get pack2() { return this.setAutoKill().build().pack2; }
    get pack3() { return this.setAutoKill().build().pack3; }
    get pack4() { return this.setAutoKill().build().pack4; }
    /**
     * @deprecated Please use `pack3` instead. `scale` is equivalent to `pack3` now.
     */
    get scale() { return this.pack3; }
    get quaternion() { return this.setAutoKill().build().quaternion; }
    get rgba() { return this.setAutoKill().build().rgba; }
    /**
     * @deprecated Please use `deg2rad` instead. `rotation` is equivalent to `deg2rad` now.
     */
    get rotation() { return this.setAutoKill().build().rotation; }
    get deg2rad() { return this.setAutoKill().build().deg2rad; }
    get durationMilliseconds() { return this.config.durationMilliseconds; }
}
exports.PFTween = PFTween;
class PFTweenValue {
    constructor(animate) {
        this.rawValue = animate;
    }
    /**
     * Take input numbers and output them in a different order.
     * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1).
     */
    swizzle(specifier) {
        return swizzle(this.rawValue, specifier);
    }
    patch(name) {
        if (!Array.isArray(this.rawValue)) {
            Patches_1.default.inputs.setScalar(name, this.rawValue);
        }
        else {
            switch (this.rawValue.length) {
                case 2:
                    Patches_1.default.inputs.setPoint2D(name, Reactive_1.default.pack2(this.rawValue[0], this.rawValue[1]));
                    break;
                case 3:
                    Patches_1.default.inputs.setPoint(name, Reactive_1.default.pack3(this.rawValue[0], this.rawValue[1], this.rawValue[2]));
                    break;
                case 4:
                    Patches_1.default.inputs.setColor(name, Reactive_1.default.RGBA(this.rawValue[0], this.rawValue[1], this.rawValue[2], this.rawValue[3]));
                    break;
                default:
                    throw `Unsupported value length: ${this.rawValue.length} values from script to patch with the name '${name}'`;
            }
        }
    }
    get scalar() {
        if (Array.isArray(this.rawValue)) {
            return this.rawValue[0];
        }
        else {
            return this.rawValue;
        }
    }
    get pack2() {
        if (Array.isArray(this.rawValue)) {
            return Reactive_1.default.pack2(this.rawValue[0] ? this.rawValue[0] : 0, this.rawValue[1] ? this.rawValue[1] : 0);
        }
        else {
            return Reactive_1.default.pack2(this.scalar, this.scalar);
        }
    }
    get pack3() {
        if (Array.isArray(this.rawValue)) {
            return Reactive_1.default.pack3(this.rawValue[0] ? this.rawValue[0] : 0, this.rawValue[1] ? this.rawValue[1] : 0, this.rawValue[2] ? this.rawValue[2] : 0);
        }
        else {
            return Reactive_1.default.pack3(this.scalar, this.scalar, this.scalar);
        }
    }
    /**
     * @deprecated Please use `pack3` instead. `scale` is equivalent to `pack3` now.
     */
    get scale() {
        return this.pack3;
    }
    get pack4() {
        if (Array.isArray(this.rawValue)) {
            return Reactive_1.default.pack4(this.rawValue[0] ? this.rawValue[0] : 0, this.rawValue[1] ? this.rawValue[1] : 0, this.rawValue[2] ? this.rawValue[2] : 0, this.rawValue[3] ? this.rawValue[3] : 0);
        }
        else {
            return Reactive_1.default.pack4(this.scalar, this.scalar, this.scalar, this.scalar);
        }
    }
    get quaternion() {
        if (Array.isArray(this.rawValue) && this.rawValue.length == 4) {
            return Reactive_1.default.quaternion(this.rawValue[3], this.rawValue[0], this.rawValue[1], this.rawValue[2]);
        }
        else {
            throw `The length of tween value' mismatched, 'quaternion' expected 4 numbers but got ${Array.isArray(this.rawValue) ? this.rawValue.length : 1}.`;
        }
    }
    get rgba() {
        return this.pack4.toRGBA();
    }
    /**
     * @deprecated Please use `deg2rad` instead. `rotation` is equivalent to `deg2rad` now.
     */
    get rotation() {
        return this.deg2rad;
    }
    get deg2rad() {
        return this.scalar.mul(degreeToRadian);
    }
}
class PFTweenProgress {
    constructor(config) {
        this.durationMilliseconds = config.durationMilliseconds;
        this.config = config;
    }
    setProgress(progress) {
        const driver = Animation_1.default.valueDriver(progress, 0, 1);
        if (this.config.useCustomCurve) {
            const progress = Animation_1.default.animate(driver, Animation_1.default.samplers.linear(0, 1));
            const y = this.config.curve.evaluate(progress);
            this.config.events.onUpdate.invokeOnMonitor(Animation_1.default.animate(Animation_1.default.valueDriver(y, 0, 1), Animation_1.default.samplers.linear(this.config.begin, this.config.end)));
        }
        else {
            this.config.events.onUpdate.invokeOnMonitor(Animation_1.default.animate(driver, this.config.sampler));
        }
    }
}
class PFTweener extends PFTweenValue {
    constructor(config) {
        const driver = Animation_1.default.timeDriver({
            durationMilliseconds: config.durationMilliseconds,
            loopCount: config.loopCount,
            mirror: config.isMirror
        });
        let tween;
        if (config.useCustomCurve) {
            const progress = Animation_1.default.animate(driver, Animation_1.default.samplers.linear(0, 1));
            const y = config.curve.evaluate(progress);
            tween = super(Animation_1.default.animate(Animation_1.default.valueDriver(y, 0, 1), Animation_1.default.samplers.linear(config.begin, config.end)));
        }
        else {
            tween = super(Animation_1.default.animate(driver, config.sampler));
        }
        // prevent unnecessary subscription 
        if (config.loopCount != Infinity) {
            config.events.onComplete.invokeOnEvent(driver.onCompleted());
        }
        else {
            config.events.onComplete.dispose();
        }
        config.events.onLoop.invokeOnEvent(driver.onAfterIteration());
        config.events.onUpdate.invokeOnMonitor(tween.rawValue);
        this.driver = driver;
        this.config = config;
        this.play = () => {
            config.events.onStart.invoke(tween);
            driver.start();
        };
        if (config.id != undefined) {
            PFTweenManager.onKill(config.id, () => {
                config.events.dispose();
                driver.stop();
            });
        }
    }
    start() {
        if (this.config.delayMilliseconds != 0) {
            Time_1.default.setTimeout(this.play, this.config.delayMilliseconds);
        }
        else {
            this.play();
        }
    }
    replay() {
        this.stop(true);
        this.start();
    }
    reset() {
        this.driver.reset();
    }
    reverse() {
        this.driver.reverse();
    }
    stop(reset = false) {
        this.driver.stop();
        if (reset) {
            this.driver.reset();
        }
    }
    get isRunning() {
        return this.driver.isRunning();
    }
}
/** Convert scalar signal to number, or the signal that contains 'xyzw' to array of numbers.*/
function toNumber(signal) {
    if (typeof signal == 'number') {
        return signal;
    }
    if (Array.isArray(signal)) {
        return signal;
    }
    if (signal.pinLastValue) {
        if (typeof signal.pinLastValue() == 'number') {
            return signal.pinLastValue();
        }
        else {
            let arr = [];
            if (signal.x && signal.x.pinLastValue)
                arr.push(signal.x.pinLastValue());
            if (signal.y && signal.y.pinLastValue)
                arr.push(signal.y.pinLastValue());
            if (signal.z && signal.z.pinLastValue)
                arr.push(signal.z.pinLastValue());
            if (signal.w && signal.w.pinLastValue)
                arr.push(signal.w.pinLastValue());
            return arr;
        }
    }
    return undefined;
}
/**
 * Take input numbers and output them in a different order.
 * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1).
 */
function swizzle(value, specifier) {
    const isArray = Array.isArray(value);
    const signal = (element) => {
        const swizzleSignal = (property) => {
            if (typeof (value) == 'number') {
                if (property == 'x') {
                    return value;
                }
                else {
                    throw `Specifier '${property}' in '${specifier}' can't be used with this signal.`;
                }
            }
            else if (value['pinLastValue'] != undefined && typeof value.pinLastValue() == 'number') {
                if (property == 'x') {
                    return value;
                }
                else {
                    throw `Specifier '${property}' in '${specifier}' can't be used with this signal.`;
                }
            }
            else {
                if (value[property] == undefined) {
                    throw `Specifier '${property}' in '${specifier}' can't be used with this signal.`;
                }
                else {
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
        case 2: return Reactive_1.default.pack2(signal(specifier[0]), signal(specifier[1]));
        case 3: return Reactive_1.default.pack3(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]));
        case 4: return Reactive_1.default.pack4(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]), signal(specifier[3]));
        default: throw `Invalid swizzle specifier: '${specifier}'`;
    }
}
