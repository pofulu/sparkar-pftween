import { PFTween, Ease } from './PFTween';

const Scene = require('Scene');

Scene.root.findByPath('**/flip/*').then(all => {
    all.forEach((plane, index) => {
        const scaleIn = new PFTween(0, 0.4, 700)
            .setDelay(index * 100)
            .setEase(Ease.easeOutBack)
            .onStartVisible(plane)
            .bind(v => plane.transform.scale = v.scale)
            .clip;

        const scaleOut = new PFTween(0.4, 0, 700)
            .setEase(Ease.easeInBack)
            .onCompleteHidden(plane)
            .bind(v => plane.transform.scale = v.scale)
            .clip;

        const rot = new PFTween(0, 360, 2000)
            .setEase(Ease.easeOutCubic)
            .onStartVisible(plane)
            .bind(v => plane.transform.rotationZ = v.rotation)
            .clip;

        scaleIn().then(rot).then(scaleOut);
    });
})