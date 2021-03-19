import Time from 'Time';
import Animation from 'Animation';
import Reactive from 'Reactive';
import { ScalarSignal } from 'ReactiveModule';

const samplers = {
    linear: Animation.samplers.linear,
    easeInQuad: Animation.samplers.easeInQuad,
    easeOutQuad: Animation.samplers.easeOutQuad,
    easeInOutQuad: Animation.samplers.easeInOutQuad,
    easeInCubic: Animation.samplers.easeInCubic,
    easeOutCubic: Animation.samplers.easeOutCubic,
    easeInOutCubic: Animation.samplers.easeInOutCubic,
    easeInQuart: Animation.samplers.easeInQuart,
    easeOutQuart: Animation.samplers.easeOutQuart,
    easeInOutQuart: Animation.samplers.easeInOutQuart,
    easeInQuint: Animation.samplers.easeInQuint,
    easeOutQuint: Animation.samplers.easeOutQuint,
    easeInOutQuint: Animation.samplers.easeInOutQuint,
    easeInSine: Animation.samplers.easeInSine,
    easeOutSine: Animation.samplers.easeOutSine,
    easeInOutSine: Animation.samplers.easeInOutSine,
    easeInExpo: Animation.samplers.easeInExpo,
    easeOutExpo: Animation.samplers.easeOutExpo,
    easeInOutExpo: Animation.samplers.easeInOutExpo,
    easeInCirc: Animation.samplers.easeInCirc,
    easeOutCirc: Animation.samplers.easeOutCirc,
    easeInOutCirc: Animation.samplers.easeInOutCirc,
    easeInBack: Animation.samplers.easeInBack,
    easeOutBack: Animation.samplers.easeOutBack,
    easeInOutBack: Animation.samplers.easeInOutBack,
    easeInElastic: Animation.samplers.easeInElastic,
    easeOutElastic: Animation.samplers.easeOutElastic,
    easeInOutElastic: Animation.samplers.easeInOutElastic,
    easeInBounce: Animation.samplers.easeInBounce,
    easeOutBounce: Animation.samplers.easeOutBounce,
    easeInOutBounce: Animation.samplers.easeInOutBounce,
    linearPingPong: (begin, end) => Animation.samplers.polyline({ keyframes: [begin, end, begin] }),
    easePingPong: (begin, end) => Animation.samplers.polybezier({ keyframes: [begin, end, begin] }),
    punch: (begin, amount) => {
        if (Array.isArray(begin) && Array.isArray(amount)) {
            return Animation.samplers.polybezier({
                keyframes: [
                    [begin[0] + (amount[0] / 5) * 4, begin[1] + (amount[1] / 5) * 4, begin[2] + (amount[2] / 5) * 4],
                    [begin[0] - (amount[0] / 5) * 3, begin[1] - (amount[1] / 5) * 3, begin[2] - (amount[2] / 5) * 3],
                    [begin[0] + (amount[0] / 5) * 2, begin[1] + (amount[1] / 5) * 2, begin[2] + (amount[2] / 5) * 2],
                    [begin[0] - (amount[0] / 5) * 1, begin[1] - (amount[1] / 5) * 1, begin[2] - (amount[2] / 5) * 1],
                    [begin[0], begin[1], begin[2]]
                ]
            })
        } else {
            return Animation.samplers.polybezier({
                keyframes: [
                    begin + (amount / 5) * 4,
                    begin - (amount / 5) * 3,
                    begin + (amount / 5) * 2,
                    begin - (amount / 5) * 1,
                    begin
                ]
            })
        }
    },
};

const degreeToRadian = 0.0174532925;

const PFTweenManager = new class {
    private table: object;

    constructor() {
        this.table = {};
    }

    onKill(id: string | symbol, callback: () => void) {
        if (this.table[id] == undefined) {
            this.table[id] = [];
        }
        this.table[id].push(callback);
    }

    kill(id: string | symbol) {
        if (this.table[id] != undefined) {
            this.table[id].forEach(callback => callback());
            delete this.table[id];
        }
    }

    hasId(id: string | symbol) {
        return this.table[id] != undefined;
    }
};

class PFTweenEvent {
    private events: ((value: any) => void)[];
    private subscription: Subscription;

    constructor() {
        this.events = [];
    }

    invoke(arg) {
        if (this.events.length > 0) {
            for (let i = 0; i < this.events.length; i++) {
                this.events[i](arg);
            }
        };
    }

    invokeOnMonitor(signal: any) {
        if (this.events.length == 0) {
            return;
        }

        if (Array.isArray(signal)) {
            let list = [];

            for (let i = 0; i < signal.length; i++) {
                list[i] = signal[i]
            }

            this.subscription = Reactive.monitorMany(list, { fireOnInitialValue: true }).select('newValues').subscribe(values => this.invoke(Object.values(values)));
        } else {
            this.subscription = signal.monitor({ fireOnInitialValue: true }).select('newValue').subscribe(value => this.invoke(value));
        }
    }

    invokeOnEvent(eventSource: EventSource) {
        if (this.events.length > 0) {
            this.subscription = eventSource.subscribe(value => this.invoke(value));
        };
    }

    add(callback: (value: any) => void) {
        this.events.push(callback);
    }

    dispose() {
        if (this.subscription != undefined) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }

        this.events = [];
    }
}

class PFTweenEvents {
    readonly onStartEvent: PFTweenEvent;
    readonly onCompleteEvent: PFTweenEvent;
    readonly onLoopEvent: PFTweenEvent;
    readonly onUpdateEvent: PFTweenEvent;

    constructor() {
        this.onStartEvent = new PFTweenEvent();
        this.onCompleteEvent = new PFTweenEvent();
        this.onLoopEvent = new PFTweenEvent();
        this.onUpdateEvent = new PFTweenEvent();
    }

    dispose() {
        this.onStartEvent.dispose();
        this.onCompleteEvent.dispose();
        this.onLoopEvent.dispose();
        this.onUpdateEvent.dispose();
    }
}

type PFTweenConfig = {
    loopCount: number;
    isMirror: boolean;
    durationMilliseconds: number;
    delayMilliseconds: number;
    sampler: ScalarSampler | ArrayOfScalarSamplers;
    events: PFTweenEvents;
    id: string | symbol;
    useCustomCurve: boolean;
    curve: ICurveProvider;
    begin: number | number[];
    end: number | number[];
}

interface PFTweenClip {
    (value?: any): Promise<{ value: any }>;
}

export interface ICurveProvider {
    evaluate(progress: number): number | ScalarSignal;
}

class PFTweenClipCancellation {
    readonly value;

    constructor(value) {
        this.value = value;
    }

    cancel() { }
}

class PFTween {
    private config: PFTweenConfig;

    constructor(begin: ScalarSignal, end: ScalarSignal, durationMilliseconds: number);
    constructor(begin: Point2DSignal, end: Point2DSignal, durationMilliseconds: number);
    constructor(begin: PointSignal, end: PointSignal, durationMilliseconds: number);
    constructor(begin: Point4DSignal, end: Point4DSignal, durationMilliseconds: number);
    constructor(begin: number[], end: number[], durationMilliseconds: number);
    constructor(begin: any, end: any, durationMilliseconds: number) {
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
        }
    }

    static combine(clips: PFTweenClip[]): PFTweenClip;
    static combine(...clips: PFTweenClip[]): PFTweenClip;
    static combine(...clips: any): PFTweenClip {
        clips = clips.flat();
        return value => Promise.all(clips.map(i => i(value))).then(endValues =>
            Promise.resolve(value != undefined ? value : endValues)
        );
    }

    static concat(clips: PFTweenClip[]): PFTweenClip;
    static concat(...clips: PFTweenClip[]): PFTweenClip;
    static concat(...clips: any): PFTweenClip {
        clips = clips.flat();
        return value => clips.slice(1).reduce((pre, cur) => pre.then(cur), clips[0](value));
    }

    static kill(id: string | symbol) {
        PFTweenManager.kill(id);
    }

    static hasId(id: string | symbol) {
        return PFTweenManager.hasId(id);
    }

    static newCancellation(value) {
        return new PFTweenClipCancellation(value);
    }

    setEase(ease: (begin: number, end: number) => ScalarSampler): PFTween;
    setEase(ease: (begin: number[], end: number[]) => ArrayOfScalarSamplers): PFTween;
    setEase(curveProvider: ICurveProvider): PFTween
    setEase() {
        if (arguments.length == 1 && instanceOfICurveProvider(arguments[0])) {
            this.config.useCustomCurve = true;
            this.config.curve = arguments[0];
            this.config.sampler = undefined;
        } else if (arguments.length == 1) {
            this.config.useCustomCurve = false;
            this.config.curve = undefined;
            this.config.sampler = arguments[0](this.config.begin, this.config.end);
        }

        return this;
    }

    setLoops(): PFTween;
    setLoops(loopCount: number): PFTween;
    setLoops(isMirror: boolean): PFTween;
    setLoops(loopCount: number, isMirror: boolean): PFTween;
    setLoops() {
        if (arguments.length == 0) {
            this.config.loopCount = Infinity;
        } else if (arguments.length == 1 && typeof arguments[0] == 'boolean') {
            this.config.loopCount = Infinity;
            this.config.isMirror = arguments[0];
        } else if (arguments.length == 1 && typeof arguments[0] == 'number') {
            this.config.loopCount = arguments[0];
        } else if (arguments.length == 2 && typeof arguments[0] == 'number' && typeof arguments[1] == 'boolean') {
            this.config.loopCount = arguments[0];
            this.config.isMirror = arguments[1];
        }
        return this;
    }

    setMirror(isMirror = true) {
        this.config.isMirror = isMirror;
        return this;
    }

    setDelay(delayMilliseconds: number) {
        this.config.delayMilliseconds = delayMilliseconds;
        return this;
    }

    setId(id: string | symbol) {
        this.config.id = id;
        return this;
    }

    setAutoKill() {
        if (this.config.id == undefined) {
            this.setId(Symbol());
        }

        this.onComplete(() => PFTweenManager.kill(this.config.id));
        return this;
    }

    onStart(callback: (value: PFTweenValue) => void) {
        this.config.events.onStartEvent.add(callback);
        return this;
    }

    onComplete(callback: () => void) {
        this.config.events.onCompleteEvent.add(callback);
        return this;
    }

    onUpdate(callback: (v: number | number[]) => void) {
        this.config.events.onUpdateEvent.add(callback);
        return this;
    }

    onLoop(callback: (value: PFTweenValue) => void) {
        this.config.events.onLoopEvent.add(callback);
        return this;
    }

    onStartVisible(sceneObject: SceneObjectBase) {
        this.onStart(() => sceneObject.hidden = false);
        return this;
    }

    onAnimatingVisibleOnly(sceneObject: SceneObjectBase) {
        this.onStartVisible(sceneObject);
        this.onCompleteHidden(sceneObject);
        return this;
    }

    onStartHidden(sceneObject: SceneObjectBase) {
        this.onStart(() => sceneObject.hidden = true);
        return this;
    }

    onCompleteVisible(sceneObject: SceneObjectBase) {
        this.onComplete(() => sceneObject.hidden = false);
        return this;
    }

    onCompleteHidden(sceneObject: SceneObjectBase) {
        this.onComplete(() => sceneObject.hidden = true);
        return this;
    }

    onCompleteResetPosition(sceneObject: SceneObjectBase) {
        const original = Reactive.pack3(
            sceneObject.transform.x.pinLastValue(),
            sceneObject.transform.y.pinLastValue(),
            sceneObject.transform.z.pinLastValue(),
        );

        this.onComplete(() => sceneObject.transform.position = original);
        return this;
    }

    onCompleteResetRotation(sceneObject: SceneObjectBase) {
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

    onCompleteResetScale(sceneObject: SceneObjectBase) {
        const original = Reactive.scale(
            sceneObject.transform.scaleX.pinLastValue(),
            sceneObject.transform.scaleY.pinLastValue(),
            sceneObject.transform.scaleZ.pinLastValue(),
        );

        this.onComplete(() => sceneObject.transform.scale = original);
        return this;
    }

    onCompleteResetOpacity(material: MaterialBase) {
        const original = material.opacity.pinLastValue();
        this.onComplete(() => material.opacity = original);
        return this;
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
    swizzle(specifier: string) {
        return this.setAutoKill().build().swizzle(specifier);
    }

    get clip(): PFTweenClip {
        if (this.config.loopCount == Infinity) {
            throw `Don't use '.clip' with infinity loop. Use finite loop or use '.${this.build.name}()' instead.`;
        }

        let promiseResolve, resolveResult;

        this.onComplete(() =>
            promiseResolve(resolveResult && resolveResult.value != undefined ? resolveResult : { value: resolveResult })
        );
        
        const tweener = this.build(false);

        return result => new Promise((resolve, reject) => {
            PFTweenManager.onKill(this.config.id, () =>
                reject(`PFTween killed: ${String(this.config.id)}`)
            );

            resolveResult = result;
            promiseResolve = resolve;

            tweener.replay();

            if (result instanceof PFTweenClipCancellation) {
                result.cancel = () => {
                    tweener.stop();
                    reject('PFTween clip canceled');
                }
            }
        });
    }

    get scalar() { return this.setAutoKill().build().scalar; }
    get pack2() { return this.setAutoKill().build().pack2; }
    get pack3() { return this.setAutoKill().build().pack3; }
    get pack4() { return this.setAutoKill().build().pack4; }
    get quaternion() { return this.setAutoKill().build().quaternion; }
    get rgba() { return this.setAutoKill().build().rgba; }
    /** This is equivalent to `.deg2rad` */
    get rotation() { return this.setAutoKill().build().rotation; }
    get deg2rad() { return this.setAutoKill().build().deg2rad; }
}

class PFTweenValue {
    private animate;

    constructor(animate) {
        this.animate = animate;
    }

    get rawValue() {
        return this.animate;
    }

    /**
     * Take input numbers and output them in a different order. 
     * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1). 
     */
    swizzle(specifier) {
        return swizzle(this.animate, specifier);
    }

    get scalar() {
        if (Array.isArray(this.animate)) {
            return this.animate[0];
        } else {
            return this.animate;
        }
    }

    get pack2() {
        if (Array.isArray(this.animate)) {
            return Reactive.pack2(this.animate[0], this.animate[1]);
        } else {
            return Reactive.pack2(this.scalar, this.scalar);
        }
    }

    get pack3() {
        if (Array.isArray(this.animate)) {
            return Reactive.pack3(this.animate[0], this.animate[1], this.animate[2]);
        } else {
            return Reactive.pack3(this.scalar, this.scalar, this.scalar);
        }
    }

    get pack4() {
        if (Array.isArray(this.animate)) {
            return Reactive.pack4(this.animate[0], this.animate[1], this.animate[2], this.animate[3]);
        } else {
            return Reactive.pack4(this.scalar, this.scalar, this.scalar, this.scalar);
        }
    }

    get quaternion() {
        if (Array.isArray(this.animate) && this.animate.length == 4) {
            return Reactive.quaternion(this.animate[3], this.animate[0], this.animate[1], this.animate[2]);
        } else {
            throw `The length of tween value' mismatched, 'quaternion' expected 4 numbers but got ${Array.isArray(this.animate) ? this.animate.length : 1}.`;
        }
    }

    get rgba() {
        return this.pack4.toRGBA();
    }

    /** This is equivalent to `.deg2rad` */
    get rotation() {
        return this.deg2rad;
    }

    get deg2rad() {
        return this.scalar.mul(degreeToRadian);
    }
}

class PFTweener extends PFTweenValue {
    private config: PFTweenConfig;
    private driver: TimeDriver;
    private play: () => void;

    constructor(config: PFTweenConfig) {
        const driver = Animation.timeDriver({ durationMilliseconds: config.durationMilliseconds, loopCount: config.loopCount, mirror: config.isMirror });
        let tween: PFTweenValue;

        if (config.useCustomCurve) {
            const progress = Animation.animate(driver, Animation.samplers.linear(0, 1));
            const y = config.curve.evaluate(progress);
            tween = super(Reactive.toRange(y, config.begin, config.end)) as unknown as PFTweenValue;
        } else {
            tween = super(Animation.animate(driver, config.sampler)) as unknown as PFTweenValue;
        }

        // prevent unnecessary subscription 
        if (config.loopCount != Infinity) {
            config.events.onCompleteEvent.invokeOnEvent(driver.onCompleted());
        }

        config.events.onLoopEvent.invokeOnEvent(driver.onAfterIteration());
        config.events.onUpdateEvent.invokeOnMonitor(tween.rawValue);

        this.driver = driver;
        this.config = config;
        this.play = () => {
            config.events.onStartEvent.invoke(tween);
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
            Time.setTimeout(this.play, this.config.delayMilliseconds);
        } else {
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

function instanceOfICurveProvider(object: any): object is ICurveProvider {
    return 'evaluate' in object;
}

/** Convert scalar signal to number, or the signal that contains 'xyzw' to array of numbers.*/
function toNumber(signal: any): number | number[] {
    if (typeof signal == 'number') {
        return signal;
    }

    if (Array.isArray(signal)) {
        return signal;
    }

    if (signal.pinLastValue) {
        if (typeof signal.pinLastValue() == 'number') {
            return signal.pinLastValue();
        } else {
            let arr = [];
            if (signal.x && signal.x.pinLastValue) arr.push(signal.x.pinLastValue());
            if (signal.y && signal.y.pinLastValue) arr.push(signal.y.pinLastValue());
            if (signal.z && signal.z.pinLastValue) arr.push(signal.z.pinLastValue());
            if (signal.w && signal.w.pinLastValue) arr.push(signal.w.pinLastValue());
            return arr;
        }
    }

    return undefined;
}

/**
 * Take input numbers and output them in a different order. 
 * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1). 
 */
function swizzle(value: any, specifier: string): any {
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

export { samplers as Ease, PFTween };