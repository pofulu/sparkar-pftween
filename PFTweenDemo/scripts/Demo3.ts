import BezierEasing from './BezierEasing';
import { PFTween } from './PFTween';
import Scene from 'Scene';

(async () => {
    const root = await Scene.root.findFirst('demo3');
    const plane0 = await root.findFirst('plane0') as Plane;
    plane0.transform.x = new PFTween(-0.1, 0.1, 1000)
        .setLoops(true)
        .scalar;

    // Use the [BezierEasing](https://github.com/pofulu/sparkar-bezier-easing) tool to set custom ease style. 
    plane0.transform.y = new PFTween(-0.1, 0.1, 1000)
        .setLoops(true)
        .setEase(new BezierEasing(1, .01, .66, 1.36))   
        .scalar;
})();