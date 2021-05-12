import { PFTween, Ease } from './PFTween';
import Time from 'Time';
import Scene from 'Scene';

(async () => {
    const root = await Scene.root.findFirst('demo0');
    const heart = await root.findFirst('heart') as Plane;

    // .build(true) with play the animation when created.
    const bump = new PFTween(1, .2, 200)
        .onStart(v => heart.transform.scale = v.pack3)
        .setEase(Ease.punch)
        .build(true);

    // Call .replay() the replay the animation.
    Time.setInterval(() => bump.replay(), 800);
})();