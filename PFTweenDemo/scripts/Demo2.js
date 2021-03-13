import { Ease, PFTween } from './PFTween';

const Materials = require('Materials');

(async () => {
    const mat_planes = await Materials.findUsingPattern('demo2.plane*');

    const fadeout_clips = mat_planes.map((mat, i) => {
        return new PFTween(1, 0, 400)
            .setEase(Ease.easeInOutSine)
            .onStart(v => mat.opacity = v.scalar)
            .setDelay(i * 100)
            .clip
    });

    const fadein_clips = mat_planes.map((mat, i) => {
        return new PFTween(0, 1, 400)
            .setEase(Ease.easeInOutSine)
            .onStart(v => mat.opacity = v.scalar)
            .setDelay(i * 100)
            .clip
    });

    (async function loopPlay() {
        await PFTween.combine(fadeout_clips)();
        await PFTween.combine(fadein_clips)();
        loopPlay();
    })();
})();