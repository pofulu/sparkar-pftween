import { PFTween, Ease } from './PFTween';

const Scene = require('Scene');
const Diagnostics = require('Diagnostics');
const TouchGestures = require('TouchGestures');

Scene.root.findFirst('plane0').then(plane0 => {

    const bump = new PFTween(1.1, 1, 200)
        .bind(v => plane0.transform.scale = v.scale)
        .setEase(Ease.easeOutCubic)
        .apply(false);

    const loop = new PFTween(0, 0, 500)
        .setLoops()
        .onStart(() => Diagnostics.log('loop start'))
        .onLoop(() => bump.replay())
        .onLoop(count => Diagnostics.log(count))
        .apply(false);

    TouchGestures.onTap().subscribe(() => loop.start());
    TouchGestures.onLongPress().subscribe(() => loop.stop());
});