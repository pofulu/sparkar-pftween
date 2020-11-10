import { Ease, PFTween } from './PFTween';

const Diagnostics = require('Diagnostics');
const TouchGestures = require('TouchGestures');
const Scene = require('Scene');

(async function () {
    const s = await Scene.root.findFirst('start');
    const p = await Scene.root.findFirst('plane0');

    const from = s.transform.position;
    const to = [.08, .12, 0];

    p.transform.position = new PFTween(from, to, 2000)
        .setEase(Ease.easePingpong)
        .setLoops()
        .setId('id')
        .swizzle('xyy');

    TouchGestures.onTap().subscribe(() => PFTween.kill('id'));
})();









