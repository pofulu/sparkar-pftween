import { PFTween, Ease } from './PFTween';
import Scene from 'Scene';
import Time from 'Time';
import Reactive from 'Reactive';

// Demo how to make more complex animations
(async () => {
    const root = await Scene.root.findFirst('demo4');
    const jump = await root.findFirst('jump') as Plane;
    const emitter0 = await root.findFirst('emitter0') as ParticleSystem;

    // Define all animations
    const moveY = new PFTween(0.05, -0.05, 300)
        .setEase(Ease.easeInQuart)
        .setLoops(6, true)
        .onStart(() => jump.transform.scale = Reactive.pack3(.6, .6, .6))
        .onStart(v => jump.transform.y = v.scalar)
        .clip;

    const wiggle = new PFTween(-10, 10, 100)
        .setLoops(11)
        .onStart(v => jump.transform.rotationZ = v.deg2rad)
        .onComplete(() => jump.transform.rotationZ = Reactive.val(0))
        .clip;

    const scale_small = new PFTween(0.6, 0.3, 1000)
        .setEase(Ease.easeInQuad)
        .onStart(v => jump.transform.scale = v.pack3)
        .clip;

    const scale_big = new PFTween(0.3, 1, 600).setEase(Ease.easeOutBack)
        .onStart(v => {
            jump.transform.scale = v.pack3;
            emitter0.birthrate = Reactive.val(200);
            Time.setTimeout(() => emitter0.birthrate = Reactive.val(0), 200);
        })
        .clip;

    // .concat/.combine your animations in the way you like
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