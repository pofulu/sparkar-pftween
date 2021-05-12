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
    private _events;
    private _subscription;
    constructor();
    get events(): ((value: any) => void)[];
    invoke(arg: any): void;
    invokeOnMonitor(signal: any): void;
    invokeOnEvent<T>(eventSource: EventSource<T>): void;
    add(callback: (value: any) => void): void;
    dispose(): void;
}
declare class PFTweenEvents {
    readonly onStart: PFTweenEvent;
    readonly onComplete: PFTweenEvent;
    readonly onLoop: PFTweenEvent;
    readonly onUpdate: PFTweenEvent;
    readonly onFinally: PFTweenEvent;
    constructor();
    dispose(): void;
}
declare class PFTweenClipCancellation {
    readonly value: any;
    constructor(value: any);
    cancel(): void;
}
interface IPFTweenClip {
    (value?: any): Promise<{
        value: any;
    }>;
}
interface ICurveProvider {
    evaluate(progress: number | ScalarSampler): number | ScalarSignal;
}
interface IPFTweenProgress {
    readonly durationMilliseconds: number;
    setProgress(progress: number): void;
    setProgress(progress: ScalarSignal): void;
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
declare type SupportType<T> = T extends number[] ? number[] | Point2DSignal | PointSignal | Point4DSignal : T extends ScalarSignal | number ? ScalarSignal | number : T extends Point2DSignal ? Point2DSignal | number[] : T extends PointSignal ? PointSignal | number[] : T extends Point4DSignal ? Point4DSignal | number[] : never;
declare type UpdateValueType<T> = T extends number[] | Point2DSignal | Point4DSignal ? number[] : T extends ScalarSignal | number ? number : never;
declare class PFTween<T extends Number | Number[] | ScalarSignal | Point2DSignal | PointSignal | Point4DSignal> {
    private config;
    constructor(begin: T, end: SupportType<T>, durationMilliseconds: number);
    static combine(clips: IPFTweenClip[]): IPFTweenClip;
    static combine(...clips: IPFTweenClip[]): IPFTweenClip;
    static concat(clips: IPFTweenClip[]): IPFTweenClip;
    static concat(...clips: IPFTweenClip[]): IPFTweenClip;
    static combineProgress(progresses: IPFTweenProgress[]): IPFTweenProgress;
    static combineProgress(...progresses: IPFTweenProgress[]): IPFTweenProgress;
    static concatProgerss(progresses: IPFTweenProgress[]): IPFTweenProgress;
    static concatProgerss(...progresses: IPFTweenProgress[]): IPFTweenProgress;
    /**
     * Stop and unsubscribe all events of the animation.
     * @param id The id you set for to your animation.
     */
    static kill(id: string | symbol): void;
    /**
     * Check if the animation of this id exist.
     * @param id
     * @returns
     */
    static hasId(id: string | symbol): boolean;
    /**
     * Create a cancellation used for interrupt clips.
     * @param value The args you want to pass to clip.
     * @returns
     */
    static newClipCancellation(value?: any): PFTweenClipCancellation;
    setEase(ease: (begin: number, end: number) => ScalarSampler): PFTween<T>;
    setEase(ease: (begin: number[], end: number[]) => ArrayOfScalarSamplers): PFTween<T>;
    setEase(curveProvider: ICurveProvider): PFTween<T>;
    setLoops(): PFTween<T>;
    setLoops(loopCount: number): PFTween<T>;
    setLoops(isMirror: boolean): PFTween<T>;
    setLoops(loopCount: number, isMirror: boolean): PFTween<T>;
    setMirror(isMirror?: boolean): this;
    /**
     * Delay to start animation, this will only delay the first time.
     */
    setDelay(delayMilliseconds: number): this;
    setId(id: string | symbol): this;
    setAutoKill(): this;
    onStart(callback: (value: PFTweenValue) => void): this;
    onComplete(callback: () => void): this;
    onUpdate(callback: (v: UpdateValueType<T>) => void): this;
    onLoop(callback: (iteration: number) => void): this;
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
    apply(autoPlay?: boolean): PFTweener;
    build(autoPlay?: boolean): PFTweener;
    /**
     * Take input numbers and output them in a different order.
     * Input values correspond to the swizzle value (xyzw) in the order theyre inputted. For example, an input of (1,2,3) and a swizzle value of (yxz) would output (2,1,3). You can also use 0 and 1. For example, a swizzle value of (x01) would output (1,0,1).
     */
    swizzle(specifier: string): any;
    /**
     * Convert
     * @param name
     * @returns
     */
    patch(name: string): void;
    /**
     * Get an evaluable animation controller.
     * Please note that the `onCompleteEvent`, `onStartEvent`, `onLoopEvent` won't work.
     */
    get progress(): PFTweenProgress;
    get clip(): IPFTweenClip;
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
    get durationMilliseconds(): number;
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
    patch(name: string): void;
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
declare class PFTweenProgress implements IPFTweenProgress {
    readonly durationMilliseconds: number;
    private config;
    constructor(config: PFTweenConfig);
    setProgress(progress: number): any;
    setProgress(progress: ScalarSignal): any;
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
export { samplers as Ease, PFTween, ICurveProvider };
