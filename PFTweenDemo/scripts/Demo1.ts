import { PFTween, Ease } from './PFTween';
import Scene from 'Scene';

(async () => {
    const root = await Scene.root.findFirst('demo1');
    const planes = await root.findByPath('plane*') as Plane[];

    const clips = planes.map((plane, index) => {
        const scaleIn = new PFTween(0, 0.4, 700)
            .setDelay(index * 100)
            .setEase(Ease.easeOutBack)
            .onStartVisible(plane)
            .onStart(v => plane.transform.scale = v.pack3)
            .clip;

        const scaleOut = new PFTween(0.4, 0, 500)
            .setEase(Ease.easeInBack)
            .onCompleteHidden(plane)
            .onStart(v => plane.transform.scale = v.pack3)
            .clip;

        const rotate = new PFTween(0, 360, 2000)
            .setEase(Ease.easeOutCubic)
            .onStart(v => plane.transform.rotationZ = v.deg2rad)
            .clip;

        // Play the three above animations in sequence.
        return PFTween.concat(scaleIn, rotate, scaleOut);
    });

    (async function loopPlay() {
        await PFTween.combine(clips)();
        loopPlay();
    })();
})();