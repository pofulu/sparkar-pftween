const Reactive = require('Reactive');

/**
 * Convert scalar signal to number, or the signal that contains 'xyzw' to array of 
 * @param {*} input 
 */
export function toNumber(input) {
    if (typeof input == 'number') {
        return input;
    }

    if (Array.isArray(input)) {
        return input;
    }

    if (input.pinLastValue) {
        return input.pinLastValue();
    }

    let arr;

    if (input.x && input.x.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(input.x.pinLastValue());
    }

    if (input.y && input.y.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(input.y.pinLastValue());
    }

    if (input.z && input.z.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(input.z.pinLastValue());
    }

    if (input.w && input.w.pinLastValue) {
        arr = arr ? arr : [];
        arr.push(input.w.pinLastValue());
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
export function swizzle(value, specifier) {
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
        }

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
    }

    switch (specifier.length) {
        case 1: return signal(specifier[0]);
        case 2: return Reactive.pack2(signal(specifier[0]), signal(specifier[1]));
        case 3: return Reactive.pack3(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]));
        case 4: return Reactive.pack4(signal(specifier[0]), signal(specifier[1]), signal(specifier[2]), signal(specifier[3]));
        default: throw `Invalid swizzle specifier: '${specifier}'`;
    }
}

/**
 * Convert Point4DSignal to RGBASignal.
 * @param {Point4DSignal} point4D 
 */
export function vec4_toRGBA(point4D) {
    return Reactive.RGBA(point4D.x, point4D.y, point4D.z, point4D.w);
}

/**
 * Convert Point4DSignal to HSVASignal.
 * @param {Point4DSignal} point4D 
 */
export function vec4_toHSVA(point4D) {
    return Reactive.HSVA(point4D.x, point4D.y, point4D.z, point4D.w);
}