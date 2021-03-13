import BezierEasing from './BezierEasing';
import { PFTween } from './PFTween';

const Scene = require('Scene');

(async () => {
    const root = await Scene.root.findFirst('demo3');
    const plane0 = await root.findFirst('plane0');
    plane0.transform.x = new PFTween(-0.1, 0.1, 1000)
        .setLoops()
        .setMirror()
        .scalar;

    plane0.transform.y = new PFTween(-0.1, 0.1, 1000)
        .setLoops()
        .setMirror()
        .setEase(new BezierEasing(1, .01, .66, 1.36))
        .scalar;
})();