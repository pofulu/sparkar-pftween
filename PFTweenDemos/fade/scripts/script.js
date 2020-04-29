import { PFTween } from './PFTween';

const Materials = require('Materials');

const mats = Materials.findUsingPattern('mat_block*');

fade();

function fade() {
    mats.then(fadeout).then(fadein).then(fade);
}

function fadeout(materials) {
    const fade_all = materials.map((material, index) =>
        new PFTween(1, 0, 500)
            .bind(v => material.opacity = v.scalar)
            .setDelay(index * 100)
            .clip()
    )

    return Promise.all(fade_all).then(() => materials);
}

function fadein(materials) {
    const fade_all = materials.map((material, index) =>
        new PFTween(0, 1, 500)
            .bind(v => material.opacity = v.scalar)
            .setDelay(index * 100)
            .clip()
    )

    return Promise.all(fade_all).then(() => materials);
}