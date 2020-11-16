import { Ease, PFTween } from './PFTween';

const Diagnostics = require('Diagnostics');
const TouchGestures = require('TouchGestures');
const Scene = require('Scene');

(async function () {
    const s = await Scene.root.findFirst('start');
    const p = await Scene.root.findFirst('plane0');

    const from = s.transform.position;
    const to = [.08, .12, 0];

    TouchGestures.onTap().subscribe(async () => {
        PFTween.killAsync('id');

        new PFTween(from, to, 2000)
            .setEase(Ease.easePingpong)
            .setDelay(1000)
            .onComplete(() => Diagnostics.log('hi'))
            .setLoops()
            .setId('id')
            .bind(v => p.transform.position = v.swizzle('xxy'))
            .apply();
    });
})();









