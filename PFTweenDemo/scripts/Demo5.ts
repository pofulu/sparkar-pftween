import Scene from 'Scene';
import Reactive from 'Reactive'
import TouchGestures from 'TouchGestures';
import CameraInfo from 'CameraInfo';
import BezierEasing from './BezierEasing';
import Patches from 'Patches';
import { Ease, PFTween } from './PFTween';

(async function () {
    const root = await Scene.root.findFirst('demo5');
    const plane0 = await root.findFirst('plane0') as Plane;
    const text = await root.findFirst('progress') as PlanarText;

    const progressX = new PFTween(-0.1, 0.1, 1000)
        .onUpdate(x => plane0.transform.x = Reactive.val(x))
        .progress;

    const progressY = new PFTween(-0.1, 0.1, 1000)
        .setEase(new BezierEasing(1, .01, .66, 1.36))
        .onUpdate(y => plane0.transform.y = Reactive.val(y))
        .progress;

    const progressScale = new PFTween([0.2, 0.2], [0.3, 0.5], 1000)
        .setEase(Ease.easeOutBounce)
        .onUpdate(scale => {
            plane0.transform.scaleX = Reactive.val(scale[0]);
            plane0.transform.scaleY = Reactive.val(scale[1]);
        })
        .progress;

    // Play x and y at the same time, and then the scale, the whole animation can be controlled by progress 0-1
    const progressAnimation = PFTween.concatProgress(PFTween.combineProgress(progressX, progressY), progressScale);

    TouchGestures.onPan().subscribe(gesture => {
        const progress = gesture.location.x.div(CameraInfo.previewSize.width);
        progressAnimation.setProgress(progress);
        text.text = progress.clamp(0, 1).format("{:.2F}");
        Patches.inputs.setScalar('demo5_progress', progress);
    });
})();
