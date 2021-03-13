import { PFTween, Ease } from './PFTween';

const Scene = require('Scene');
const Diagnostics = require('Diagnostics');
const Time = require('Time');
const Reactive = require('Reactive');

(async () => {
    const root = await Scene.root.findFirst('demo4');
    const jump = await root.findFirst('jump');
    const emitter0 = await root.findFirst('emitter0');

    const moveY = new PFTween(0.05, -0.05, 300)
        .setEase(Ease.easeInQuart)
        .setLoops(6)
        .setMirror()
        .onStart(() => jump.transform.scale = Reactive.pack3(.6, .6, .6))
        .onStart(v => jump.transform.y = v.scalar)
        .clip;

    const wiggle = new PFTween(-10, 10, 100)
        .setLoops(11)
        .onStart(v => jump.transform.rotationZ = v.rotation)
        .onComplete(() => jump.transform.rotationZ = 0)
        .clip;

    const scale_small = new PFTween(0.6, 0.3, 1000)
        .setEase(Ease.easeInQuad)
        .onStart(v => jump.transform.scale = v.pack3)
        .clip;

    const scale_big = new PFTween(0.3, 1, 600).setEase(Ease.easeOutBack)
        .onStart(v => jump.transform.scale = v.pack3)
        .onStart(() => {
            emitter0.birthrate = 200;
            Time.setTimeout(() => emitter0.birthrate = 0, 200);
        })
        .clip;

    const animation = PFTween.concat(
        moveY,
        PFTween.combine(wiggle, scale_small),
        scale_big,
    );

    (async function loopPlay() {
        await animation();
        loopPlay()
    })();
})();


