import { PFTween, Ease } from './PFTween';

const Scene = require('Scene');
const Time = require('Time');

(async () => {
    const root = await Scene.root.findFirst('demo0');
    const heart = await root.findFirst('heart');

    const bump = new PFTween(1, .2, 200)
        .onStart(v => heart.transform.scale = v.pack3)
        .setEase(Ease.punch)
        .apply();

    Time.setInterval(() => bump.replay(), 800);
})();