import { PFTween, Ease } from './PFTween';

const Scene = require('Scene');
const Time = require('Time');

Scene.root.findFirst('jump').then(jumping => {
    const moveY = new PFTween(0.05, -0.05, 300)
        .setEase(Ease.easeInQuart)
        .setLoops(6)
        .setMirror()
        .bind(v => jumping.transform.y = v.scalar)
        .clip;

    const wiggle = new PFTween(-10, 10, 100)
        .setLoops(11)
        .bind(v => jumping.transform.rotationZ = v.rotation)
        .onComplete(() => jumping.transform.rotationZ = 0)
        .clip;

    const scale_small = new PFTween(0.6, 0.3, 1000)
        .setEase(Ease.easeInQuad)
        .bind(v => jumping.transform.scale = v.scale)
        .clip;

    const scale_big = new PFTween(0.3, 1, 600).setEase(Ease.easeOutBack)
        .bind(v => jumping.transform.scale = v.scale)
        .onStart(burst_particle)
        .clip;

    moveY().then(PFTween.combine(wiggle, scale_small)).then(scale_big)
});

function burst_particle() {
    Scene.root.findFirst('emitter0').then(em => {
        em.birthrate = 200;
        Time.setTimeout(() => em.birthrate = 0, 200);
    });
}