import Time from 'Time';
import Animation from 'Animation';
import Scene from 'Scene';
import Reactive from 'Reactive';
import Patches from 'Patches';

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
    private _events: ((value: any) => void)[];
    private _subscription: Subscription;

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
        };
    }

    invokeOnMonitor(signal: any) {
        if (this._events.length == 0) {
            return;
        }

        if (Array.isArray(signal)) {
            let list: { [name: string]: ScalarSignal } = {};

            for (let i = 0; i < signal.length; i++) {
                list[i] = signal[i]
            }

            this._subscription = Reactive.monitorMany(list, { fireOnInitialValue: true }).subscribe(values => this.invoke(Object.values(values.newValues)));
        } else {
            this._subscription = signal.monitor({ fireOnInitialValue: true }).select('newValue').subscribe(value => this.invoke(value));
        }
    }

    invokeOnEvent<T>(eventSource: EventSource<T>) {
        if (this._events.length > 0) {
            this._subscription = eventSource.subscribe(value => this.invoke(value));
        }
    }

    add(callback: (value: any) => void) {
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
    readonly onStart: PFTweenEvent;
    readonly onComplete: PFTweenEvent;
    readonly onLoop: PFTweenEvent;
    readonly onUpdate: PFTweenEvent;
    readonly onFinally: PFTweenEvent;

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
    readonly value: any;

    constructor(value: any) {
        this.value = value;
    }

    cancel() { }
}

interface IPFTweenClip {
    (value?: any): Promise<{ value: any }>;
}

interface ICurveProvider {
    evaluate(progress: number | ScalarSampler): number | ScalarSignal;
}

function instanceOfICurveProvider(object: any): object is ICurveProvider {
    return 'evaluate' in object;
}

interface IPFTweenProgress {
    readonly durationMilliseconds: number;
    setProgress(progress: number): void;
    setProgress(progress: ScalarSignal): void;
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

type SupportType<T> =
    T extends number[] ? number[] | Point2DSignal | PointSignal | Point4DSignal :
    T extends ScalarSignal | number ? ScalarSignal | number :
    T extends Point2DSignal ? Point2DSignal | number[] :
    T extends PointSignal ? PointSignal | number[] :
    T extends Point4DSignal ? Point4DSignal | number[] :
    never;

type UpdateValueType<T> =
    T extends number[] | Point2DSignal | Point4DSignal ? number[] :
    T extends ScalarSignal | number ? number :
    never;

class PFTween<T extends Number | Number[] | ScalarSignal | Point2DSignal | PointSignal | Point4DSignal> {
    private config: PFTweenConfig;

    constructor(begin: T, end: SupportType<T>, durationMilliseconds: number);
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

    static combine(clips: IPFTweenClip[]): IPFTweenClip;
    static combine(...clips: IPFTweenClip[]): IPFTweenClip;
    static combine(...clips) {
        clips = clips.flat();
        return value => Promise.all(clips.map(i => i(value))).then(endValues =>
            Promise.resolve(value != undefined ? value : endValues)
        );
    }

    static concat(clips: IPFTweenClip[]): IPFTweenClip;
    static concat(...clips: IPFTweenClip[]): IPFTweenClip;
    static concat(...clips) {
        clips = clips.flat();
        return value => clips.slice(1).reduce((pre, cur) => pre.then(cur), clips[0](value));
    }

    static combineProgress(progresses: IPFTweenProgress[]): IPFTweenProgress;
    static combineProgress(...progresses: IPFTweenProgress[]): IPFTweenProgress;
    static combineProgress(...progresses) {
        progresses = progresses.flat();
        const max = Math.max(...progresses.map(pftween => pftween.durationMilliseconds));

        return {
            get durationMilliseconds() { return max },
            setProgress(progress) {
                for (let i = 0; i < progresses.length; i++) {
                    const tween = progresses[i];
                    tween.setProgress(Reactive.fromRange(progress, 0, tween.durationMilliseconds / max))
                }
            }
        }
    }


    /** @deprecated It's typo of 'concatProgress' */
    static concatProgerss(progresses: IPFTweenProgress[]): IPFTweenProgress;
    /** @deprecated It's typo of 'concatProgress' */
    static concatProgerss(...progresses: IPFTweenProgress[]): IPFTweenProgress;
    static concatProgerss(...progresses: any) {
        progresses = progresses.flat();
        return PFTween.concatProgress(progresses);
    }

    static concatProgress(progresses: IPFTweenProgress[]): IPFTweenProgress;
    static concatProgress(...progresses: IPFTweenProgress[]): IPFTweenProgress;
    static concatProgress(...progresses) {
        progresses = progresses.flat();
        const total = progresses
            .map(pftween => pftween.durationMilliseconds)
            .reduce((pre, cur) => pre + cur, 0);

        return {
            get durationMilliseconds() { return total },
            setProgress(progress) {
                let last = 0;

                for (let i = 0; i < progresses.length; i++) {
                    const tween = progresses[i];
                    const end = last + tween.durationMilliseconds / total;
                    tween.setProgress(Reactive.fromRange(progress, last, end))
                    last = end;
                }
            }
        }
    }

    /**
     * Stop and unsubscribe all events of the animation.
     * @param id The id you set for to your animation.
     */
    static kill(id: string | symbol) {
        PFTweenManager.kill(id);
    }

    /**
     * Check if the animation of this id exist.
     * @param id 
     * @returns 
     */
    static hasId(id: string | symbol) {
        return PFTweenManager.hasId(id);
    }

    /**
     * Create a cancellation used for interrupt clips.
     * @param value The args you want to pass to clip.
     * @returns 
     */
    static newClipCancellation(value?: any) {
        return new PFTweenClipCancellation(value);
    }

    setEase(ease: (begin: number, end: number) => ScalarSampler): PFTween<T>;
    setEase(ease: (begin: number[], end: number[]) => ArrayOfScalarSamplers): PFTween<T>;
    setEase(curveProvider: ICurveProvider): PFTween<T>
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

    setLoops(): PFTween<T>;
    setLoops(loopCount: number): PFTween<T>;
    setLoops(isMirror: boolean): PFTween<T>;
    setLoops(loopCount: number, isMirror: boolean): PFTween<T>;
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

    /**
     * Delay to start animation, this will only delay the first time.
     */
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

        this.config.events.onFinally.add(() => PFTweenManager.kill(this.config.id));
        return this;
    }

    onStart(callback: (value: PFTweenValue) => void) {
        this.config.events.onStart.add(callback);
        return this;
    }

    onComplete(callback: () => void) {
        this.config.events.onComplete.add(callback);
        return this;
    }

    onUpdate(callback: (v: UpdateValueType<T>) => void) {
        this.config.events.onUpdate.add(callback);
        return this;
    }

    onLoop(callback: (iteration: number) => void) {
        this.config.events.onLoop.add(callback);
        return this;
    }

    onStartVisible(sceneObject: SceneObjectBase) {
        this.onStart(() => sceneObject.hidden = Reactive.val(false));
        return this;
    }

    onAnimatingVisibleOnly(sceneObject: SceneObjectBase) {
        this.onStartVisible(sceneObject);
        this.onCompleteHidden(sceneObject);
        return this;
    }

    onStartHidden(sceneObject: SceneObjectBase) {
        this.onStart(() => sceneObject.hidden = Reactive.val(true));
        return this;
    }

    onCompleteVisible(sceneObject: SceneObjectBase) {
        this.onComplete(() => sceneObject.hidden = Reactive.val(false));
        return this;
    }

    onCompleteHidden(sceneObject: SceneObjectBase) {
        this.onComplete(() => sceneObject.hidden = Reactive.val(true));
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

    /**
     * @deprecated Please use `onStart(callback)` instead. The callback of `onStart` receive the tween value. `bind` is equivalent to `onStart` now.
     */
    bind(callback: (value: PFTweenValue) => void) {
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
    swizzle(specifier: string) {
        return this.setAutoKill().build().swizzle(specifier);
    }

    /**
     * Convert 
     * @param name 
     * @returns 
     */
    patch(name: string) { return this.setAutoKill().build().patch(name); }

    /**
     * Get an evaluable animation controller.
     * Please note that the `onCompleteEvent`, `onStartEvent`, `onLoopEvent` won't work.
     */
    get progress(): PFTweenProgress {
        this.config.events.onComplete.dispose();
        this.config.events.onStart.dispose();
        this.config.events.onLoop.dispose();
        return new PFTweenProgress(this.config);
    }

    get clip(): IPFTweenClip {
        let promiseResolve, resolveResult;

        this.onComplete(() =>
            promiseResolve(resolveResult && (resolveResult.value || resolveResult.cancel) ? resolveResult : { value: resolveResult })
        );

        const tweener = this.build(false);

        return result => new Promise<any>((resolve, reject) => {
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
    swizzle(specifier: string) {
        return swizzle(this.animate, specifier);
    }

    patch(name: string) {
        if (!Array.isArray(this.animate)) {
            Patches.inputs.setScalar(name, this.animate);
        } else {
            switch (this.animate.length) {
                case 2:
                    Patches.inputs.setPoint2D(name, Reactive.pack2(this.animate[0], this.animate[1]));
                    break;

                case 3:
                    Patches.inputs.setPoint(name, Reactive.pack3(this.animate[0], this.animate[1], this.animate[2]));
                    break;

                case 4:
                    Patches.inputs.setColor(name, Reactive.RGBA(this.animate[0], this.animate[1], this.animate[2], this.animate[3]));
                    break;

                default:
                    throw `Unsupported value length: ${this.animate.length} values from script to patch with the name '${name}'`;
            }
        }
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
            return Reactive.pack2(
                this.animate[0] ? this.animate[0] : 0,
                this.animate[1] ? this.animate[1] : 0,
            );
        } else {
            return Reactive.pack2(this.scalar, this.scalar);
        }
    }

    get pack3() {
        if (Array.isArray(this.animate)) {
            return Reactive.pack3(
                this.animate[0] ? this.animate[0] : 0,
                this.animate[1] ? this.animate[1] : 0,
                this.animate[2] ? this.animate[2] : 0,
            );
        } else {
            return Reactive.pack3(this.scalar, this.scalar, this.scalar);
        }
    }

    /**
     * @deprecated Please use `pack3` instead. `scale` is equivalent to `pack3` now.
     */
    get scale() {
        return this.pack3;
    }

    get pack4() {
        if (Array.isArray(this.animate)) {
            return Reactive.pack4(
                this.animate[0] ? this.animate[0] : 0,
                this.animate[1] ? this.animate[1] : 0,
                this.animate[2] ? this.animate[2] : 0,
                this.animate[3] ? this.animate[3] : 0
            );
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

class PFTweenProgress implements IPFTweenProgress {
    readonly durationMilliseconds: number;
    private config: PFTweenConfig;

    constructor(config: PFTweenConfig) {
        this.durationMilliseconds = config.durationMilliseconds;
        this.config = config;
    }

    setProgress(progress: number): void;
    setProgress(progress: ScalarSignal): void;
    setProgress(progress: any) {
        const driver = Animation.valueDriver(progress, 0, 1);
        if (this.config.useCustomCurve) {
            const progress = Animation.animate(driver, Animation.samplers.linear(0, 1));
            const y = this.config.curve.evaluate(progress);
            this.config.events.onUpdate.invokeOnMonitor(Animation.animate(Animation.valueDriver(y, 0, 1), Animation.samplers.linear(this.config.begin, this.config.end)));
        } else {
            this.config.events.onUpdate.invokeOnMonitor(Animation.animate(driver, this.config.sampler));
        }
    }
}

class PFTweener extends PFTweenValue {
    private config: PFTweenConfig;
    private driver: TimeDriver;
    private play: () => void;

    constructor(config: PFTweenConfig) {
        const driver = Animation.timeDriver({
            durationMilliseconds: config.durationMilliseconds,
            loopCount: config.loopCount,
            mirror: config.isMirror
        });

        let tween: PFTweenValue;

        if (config.useCustomCurve) {
            const progress = Animation.animate(driver, Animation.samplers.linear(0, 1));
            const y = config.curve.evaluate(progress);
            tween = super(Animation.animate(Animation.valueDriver(y, 0, 1), Animation.samplers.linear(config.begin, config.end))) as unknown as PFTweenValue;
        } else {
            tween = super(Animation.animate(driver, config.sampler)) as unknown as PFTweenValue;
        }

        // prevent unnecessary subscription 
        if (config.loopCount != Infinity) {
            config.events.onComplete.invokeOnEvent(driver.onCompleted());
        } else {
            config.events.onComplete.dispose();
        }

        config.events.onLoop.invokeOnEvent(driver.onAfterIteration());
        config.events.onUpdate.invokeOnMonitor(tween);

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

/** Convert scalar signal to number, or the signal that contains 'xyzw' to array of numbers.*/
function toNumber(signal: any): number | number[] | undefined {
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

    const signal = (element: string) => {
        const swizzleSignal = (property: string) => {
            if (typeof (value) == 'number') {
                if (property == 'x') {
                    return value;
                } else {
                    throw `Specifier '${property}' in '${specifier}' can't be used with this signal.`;
                }
            } else if (value['pinLastValue'] != undefined && typeof value.pinLastValue() == 'number') {
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

export { samplers as Ease, PFTween, ICurveProvider, IPFTweenClip, IPFTweenProgress, PFTweener };