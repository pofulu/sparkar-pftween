import Reactive from 'Reactive';
import { ScalarSignal } from 'ReactiveModule';

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 12;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_MAX_ITERATIONS = 10;

function A(aA1, aA2) {
    // return 1.0 - 3.0 * aA2 + 3.0 * aA1;
    return Reactive.sub(1, Reactive.mul(3, aA2)).add(Reactive.mul(3, aA1));
}

function B(aA1, aA2) {
    // return 3.0 * aA2 - 6.0 * aA1;
    return Reactive.mul(3, aA2).sub(Reactive.mul(6, aA1));
}

function C(aA1) {
    // return 3.0 * aA1;
    return Reactive.mul(3, aA1);
}

/** Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2. */
function calcBezier(aT, aA1, aA2) {
    // return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
    return Reactive.mul(A(aA1, aA2), aT).add(B(aA1, aA2)).mul(aT).add(C(aA1)).mul(aT);
}

/** Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2. */
function getSlope(aT, aA1, aA2) {
    // return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
    return Reactive.mul(3, A(aA1, aA2)).mul(aT).mul(aT).add(Reactive.mul(2, B(aA1, aA2)).mul(aT)).add(C(aA1));
}

function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    let currentSlope, currentX;

    for (let i = 0; i < NEWTON_ITERATIONS; i++) {
        currentSlope = getSlope(aGuessT, mX1, mX2);
        currentX = calcBezier(aGuessT, mX1, mX2).sub(aX);
        aGuessT = Reactive.eq(currentSlope, 0).ifThenElse(aGuessT, Reactive.sub(aGuessT, currentX.div(currentSlope)));
    }

    return aGuessT;
}

function binarySubdivide(aX, aA, aB, mX1, mX2) {
    let currentX, currentT;

    for (let i = 0; i < SUBDIVISION_MAX_ITERATIONS; i++) {
        currentT = Reactive.add(aA, Reactive.sub(aB, aA).mul(.5));
        currentX = calcBezier(currentT, mX1, mX2).sub(aX);
        aB = Reactive.gt(currentX, 0).ifThenElse(currentT, aB);
        aA = Reactive.le(currentX, 0).ifThenElse(currentT, aA);
    }

    return currentT;
}

export default class {
    private sampler;

    constructor(mX1: number, mY1: number, mX2: number, mY2: number) {
        const getTForX = (aX) => {
            const slope = getSlope(aX, mX1, mX2);

            return Reactive.ge(slope, NEWTON_MIN_SLOPE).ifThenElse(
                newtonRaphsonIterate(aX, aX, mX1, mX2),
                Reactive.eq(slope, 0).ifThenElse(
                    aX,
                    binarySubdivide(aX, aX, aX, mX1, mX2)
                )
            );
        }
        const linear = function (progress) {
            return progress;
        }

        const bezier = function (progress) {
            // Because JavaScript number are imprecise, we should guarantee the extremes are right.
            const progressIs0or1 = Reactive.eq(progress, 0).or(Reactive.eq(progress, 1));
            return progressIs0or1.ifThenElse(progress, calcBezier(getTForX(progress), mY1, mY2));
        }

        this.sampler = progress => Reactive.and(
            Reactive.eq(mX1, mY1),
            Reactive.eq(mX2, mY2)
        ).ifThenElse(
            linear(progress),
            bezier(progress)
        );
    }

    evaluate(progress: number | ScalarSignal): ScalarSignal {
        return this.sampler(progress);
    }
}