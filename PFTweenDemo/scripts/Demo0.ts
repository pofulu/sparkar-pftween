import { PFTween, Ease } from './PFTween';
import Time from 'Time';
import Scene from 'Scene';

(async () => {
    const root = await Scene.root.findFirst('demo0');
    const heart = await root.findFirst('heart');

    const bump = new PFTween(1, .2, 200)
        .onStart(v => heart.transform.scale = v.pack3)
        .setEase(Ease.punch)
        .build();

    Time.setInterval(() => bump.replay(), 800);
})();