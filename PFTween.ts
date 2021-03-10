import Time from 'Time';
import Animation from 'Animation';
import Reactive from 'Reactive';

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

    subscribeOnEvent(eventSource: EventSource) {
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
        }

        this.events = [];
    }
}

class PFTweenEvents {
    readonly onStartEvent: PFTweenEvent;
    readonly onCompleteEvent: PFTweenEvent;
    readonly onLoopEvent: PFTweenEvent;

    constructor() {
        this.onStartEvent = new PFTweenEvent();
        this.onCompleteEvent = new PFTweenEvent();
        this.onLoopEvent = new PFTweenEvent();
    }

    dispose() {
        this.onStartEvent.dispose();
        this.onCompleteEvent.dispose();
        this.onLoopEvent.dispose();
    }
}

class PFTweenConfig {
    loopCount: number;
    isMirror: boolean;
    durationMilliseconds: number;
    delayMilliseconds: number;
    sampler: ScalarSampler | ArrayOfScalarSamplers;
    events: PFTweenEvents;
    id: string | symbol;

    constructor() {
        this.id = Symbol();
    }
}

interface PFTweenClip {
    (): Promise<void>;
}

class PFTween {
    private config: PFTweenConfig;
    private begin: number[] | number;
    private end: number[] | number;

    constructor(begin: number, end: number, durationMilliseconds: number);
    constructor(begin: number[], end: number[], durationMilliseconds: number);
    constructor(begin: any, end: any, durationMilliseconds: number) {
        this.config = new PFTweenConfig();
        this.config.events = new PFTweenEvents();
        this.config.durationMilliseconds = durationMilliseconds;
        this.config.sampler = samplers.linear(begin, end);
        this.begin = toNumber(begin);
        this.end = toNumber(end);
    }

    static combine(...clips: PFTweenClip[]) {
        clips = clips.flat();
        return result => Promise.all(clips.map(i => i())).then(endValues =>
            Promise.resolve(result != undefined ? result : endValues)
        );
    }

    static concat(...clips: PFTweenClip[]) {
        clips = clips.flat();
        return result => clips.slice(1).reduce((pre, cur) => pre.then(cur), clips[0](result));
    }

    static kill(id: string | symbol) {
        PFTweenManager.kill(id);
    }

    static hasId(id: string | symbol) {
        return PFTweenManager.hasId(id);
    }

    setEase(ease: (begin: number | number[], end: number | number[]) => ScalarSampler | ArrayOfScalarSamplers) {
        this.config.sampler = ease(this.begin, this.end);
        return this;
    }

    setLoops(loopCount = Infinity) {
        this.config.loopCount = loopCount;
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

    onStart(callback: (value: PFTweenValue) => void) {
        this.config.events.onStartEvent.add(callback);
        return this;
    }

    onComplete(callback: () => void) {
        this.config.events.onCompleteEvent.add(callback);
        return this;
    }

    onLoop(callback: (value: PFTweenValue) => void) {
        this.config.events.onLoopEvent.add(callback);
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

    apply(autoPlay = true) {
        const tweener = new PFTweener(this.config);

        if (autoPlay) {
            tweener.start();
        }

        return tweener;
    }

    swizzle(specifier: string) {
        return this.setAutoKill().apply().swizzle(specifier);
    }

    get clip(): PFTweenClip {
        let promiseResolve, promiseReject;

        this.onComplete(() => promiseResolve());

        PFTweenManager.onKill(this.config.id, () => {
            if (promiseReject != undefined) {
                promiseReject();
            }
        });

        return () => {
            this.apply();
            return new Promise<void>((resolve, reject) => {
                promiseResolve = resolve;
                promiseReject = reject;
            });
        }
    }

    get scalar() { return this.setAutoKill().apply().scalar; }
    get pack2() { return this.setAutoKill().apply().pack2; }
    get pack3() { return this.setAutoKill().apply().pack3; }
    get pack4() { return this.setAutoKill().apply().pack4; }
    get rotation() { return this.setAutoKill().apply().rotation; }
    get deg2rad() { return this.setAutoKill().apply().deg2rad; }
}

class PFTweenValue {
    private animate;

    constructor(animate) {
        this.animate = animate;
    }

    swizzle(specifier) {
        return swizzle(this.animate, specifier);
    }

    get scalar() {
        return this.swizzle('x');
    }

    get pack2() {
        return this.swizzle(Array.isArray(this.animate) ? 'xy' : 'xx');
    }

    get pack3() {
        return this.swizzle(Array.isArray(this.animate) ? 'xyz' : 'xxx');
    }

    get pack4() {
        return this.swizzle(Array.isArray(this.animate) ? 'xyzw' : 'xxxx');
    }

    get deg2rad() {
        return this.scalar.mul(degreeToRadian);
    }

    get rotation() {
        return this.deg2rad;
    }
}

class PFTweener extends PFTweenValue {
    private config: PFTweenConfig;
    private driver: TimeDriver;
    private play: () => void;

    constructor(config: PFTweenConfig) {
        const driver = Animation.timeDriver({ durationMilliseconds: config.durationMilliseconds, loopCount: config.loopCount, mirror: config.isMirror });
        const tween = super(Animation.animate(driver, config.sampler));

        this.driver = driver;
        this.config = config;

        config.events.onCompleteEvent.subscribeOnEvent(this.driver.onCompleted());
        config.events.onLoopEvent.subscribeOnEvent(this.driver.onAfterIteration());

        this.play = () => {
            config.events.onStartEvent.invoke(tween);
            driver.start();
        }

        PFTweenManager.onKill(config.id, () => {
            config.events.dispose();
            driver.stop();
        });
    }

    start() {
        if (this.config.delayMilliseconds) {
            Time.setTimeout(this.play, this.config.delayMilliseconds);
        } else {
            this.play();
        }
    }

    replay() {
        this.driver.reset();
        this.driver.start();
    }

    reset() {
        this.driver.reset();
    }

    reverse() {
        this.driver.reverse();
    }

    pause() {
        this.driver.stop();
    }

    stop() {
        this.driver.reset();
        this.driver.stop();
    }

    isRunning() {
        this.driver.isRunning();
    }
}

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

export { samplers as Ease, PFTween };