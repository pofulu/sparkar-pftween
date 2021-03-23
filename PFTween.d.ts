declare const samplers: {
    linear: any;
    easeInQuad: any;
    easeOutQuad: any;
    easeInOutQuad: any;
    easeInCubic: any;
    easeOutCubic: any;
    easeInOutCubic: any;
    easeInQuart: any;
    easeOutQuart: any;
    easeInOutQuart: any;
    easeInQuint: any;
    easeOutQuint: any;
    easeInOutQuint: any;
    easeInSine: any;
    easeOutSine: any;
    easeInOutSine: any;
    easeInExpo: any;
    easeOutExpo: any;
    easeInOutExpo: any;
    easeInCirc: any;
    easeOutCirc: any;
    easeInOutCirc: any;
    easeInBack: any;
    easeOutBack: any;
    easeInOutBack: any;
    easeInElastic: any;
    easeOutElastic: any;
    easeInOutElastic: any;
    easeInBounce: any;
    easeOutBounce: any;
    easeInOutBounce: any;
    linearPingPong: (begin: any, end: any) => any;
    easePingPong: (begin: any, end: any) => any;
    punch: (begin: any, amount: any) => any;
};
declare class PFTweenEvent {
    private events;
    private subscription;
    constructor();
    invoke(arg: any): void;
    invokeOnMonitor(signal: any): void;
    invokeOnEvent(eventSource: EventSource): void;
    add(callback: (value: any) => void): void;
    dispose(): void;
}
declare class PFTweenEvents {
    readonly onStartEvent: PFTweenEvent;
    readonly onCompleteEvent: PFTweenEvent;
    readonly onLoopEvent: PFTweenEvent;
    readonly onUpdateEvent: PFTweenEvent;
    constructor();
    dispose(): void;
}
declare type PFTweenConfig = {
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
};
interface PFTweenClip {
    (value?: any): Promise<{
        value: any;
    }>;
}
export interface ICurveProvider {
    evaluate(progress: number): number | ScalarSignal;
}
declare class PFTweenClipCancellation {
    readonly value: any;
    constructor(value: any);
    cancel(): void;
}
declare class PFTween {
    private config;
    constructor(begin: number, end: number, durationMilliseconds: number);
    constructor(begin: number[], end: number[], durationMilliseconds: number);
    constructor(begin: ScalarSignal, end: ScalarSignal, durationMilliseconds: number);
    constructor(begin: Point2DSignal, end: Point2DSignal, durationMilliseconds: number);
    constructor(begin: PointSignal, end: PointSignal, durationMilliseconds: number);
    constructor(begin: Point4DSignal, end: Point4DSignal, durationMilliseconds: number);
    static combine(clips: PFTweenClip[]): PFTweenClip;
    static combine(...clips: PFTweenClip[]): PFTweenClip;
    static concat(clips: PFTweenClip[]): PFTweenClip;
    static concat(...clips: PFTweenClip[]): PFTweenClip;
    static kill(id: string | symbol): void;
    static hasId(id: string | symbol): boolean;
    static newClipCancellation(value?: any): PFTweenClipCancellation;
    setEase(ease: (begin: number, end: number) => ScalarSampler): PFTween;
    setEase(ease: (begin: number[], end: number[]) => ArrayOfScalarSamplers): PFTween;
    setEase(curveProvider: ICurveProvider): PFTween;
    setLoops(): PFTween;
    setLoops(loopCount: number): PFTween;
    setLoops(isMirror: boolean): PFTween;
    setLoops(loopCount: number, isMirror: boolean): PFTween;
    setMirror(isMirror?: boolean): this;
    setDelay(delayMilliseconds: number): this;
    setId(id: string | symbol): this;
    setAutoKill(): this;
    onStart(callback: (value: PFTweenValue) => void): this;
    onComplete(callback: () => void): this;
    onUpdate(callback: (v: number | number[]) => void): this;
    onLoop(callback: (value: PFTweenValue) => void): this;
    onStartVisible(sceneObject: SceneObjectBase): this;
    onAnimatingVisibleOnly(sceneObject: SceneObjectBase): this;
    onStartHidden(sceneObject: SceneObjectBase): this;
    onCompleteVisible(sceneObject: SceneObjectBase): this;
    onCompleteHidden(sceneObject: SceneObjectBase): this;
    onCompleteResetPosition(sceneObject: SceneObjectBase): this;
    onCompleteResetRotation(sceneObject: SceneObjectBase): this;
    onCompleteResetScale(sceneObject: SceneObjectBase): this;
    onCompleteResetOpacity(material: MaterialBase): this;
    /**
     * @deprecated Please use `onStart(callback)` instead. The callback of `onStart` receive the tween value. `bind` is equivalent to `onStart` now.
     */
    bind(callback: (value: PFTweenValue) => void): this;
    /**
     * @deprecated Please use `build()` instead. `apply` is equivalent to `build` now.
     */
    apply(autoPlay?: boolean): void;
    build(autoPlay?: boolean): PFTweener;
    /**
     * Take input numbers and output them in a different order.
     * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1).
     */
    swizzle(specifier: string): any;
    get clip(): PFTweenClip;
    get scalar(): any;
    get pack2(): any;
    get pack3(): any;
    get pack4(): any;
    /**
     * @deprecated Please use `pack3` instead. `scale` is equivalent to `pack3` now.
     */
    get scale(): any;
    get quaternion(): any;
    get rgba(): any;
    /**
     * @deprecated Please use `deg2rad` instead. `rotation` is equivalent to `deg2rad` now.
     */
    get rotation(): any;
    get deg2rad(): any;
}
declare class PFTweenValue {
    private animate;
    constructor(animate: any);
    get rawValue(): any;
    /**
     * Take input numbers and output them in a different order.
     * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1).
     */
    swizzle(specifier: any): any;
    get scalar(): any;
    get pack2(): any;
    get pack3(): any;
    /**
     * @deprecated Please use `pack3` instead. `scale` is equivalent to `pack3` now.
     */
    get scale(): any;
    get pack4(): any;
    get quaternion(): any;
    get rgba(): any;
    /**
     * @deprecated Please use `deg2rad` instead. `rotation` is equivalent to `deg2rad` now.
     */
    get rotation(): any;
    get deg2rad(): any;
}
declare class PFTweener extends PFTweenValue {
    private config;
    private driver;
    private play;
    constructor(config: PFTweenConfig);
    start(): void;
    replay(): void;
    reset(): void;
    reverse(): void;
    stop(reset?: boolean): void;
    get isRunning(): any;
}
export { samplers as Ease, PFTween };
