import { Ease, PFTween } from './PFTween';
import Materials from 'Materials';

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
        // Use .combine() to play all of animations at the same time.
        await PFTween.combine(fadeout_clips)();

        // await all planes fade out then play the fadein animations.
        await PFTween.combine(fadein_clips)();

        // await until all fade out finish then loop playing.
        loopPlay();
    })();
})();