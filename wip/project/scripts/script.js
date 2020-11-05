
import { Ease, PFTween } from './PFTween';

const Scene = require('Scene');
const Diagnostics = require('Diagnostics');
const TouchGestures = require('TouchGestures');
const Time = require('Time');
const Animation = require('Animation');

// test_onUpdate();
// test_arrayOfNumber();
// test_arrayOfRotation();
// test_arrayOfNumberSingle();
// test_arrayOfNumberUpdate();

async function test_arrayOfNumberUpdate() {
    const plane0 = await Scene.root.findFirst('plane0');

    const cancellation = PFTween.newClipCancellation();
    const a = PFTween.concat(
        new PFTween([0, 0, 0], [.2, 0, 0], 1000).setEase(Ease.easeOutCirc).onUpdate(v => plane0.transform.position = v.pack3).clip,
        new PFTween([.2, 0, 0], [.2, .2, 0], 1000).setEase(Ease.easeOutCirc).onUpdate(v => plane0.transform.position = v.pack3).clip,
        new PFTween([.2, .2, 0], [0, .2, 0], 1000).setEase(Ease.easeOutCirc).onUpdate(v => plane0.transform.position = v.pack3).clip,
        new PFTween([0, .2, 0], [0, 0, 0], 1000).setEase(Ease.easeOutCirc).onUpdate(v => plane0.transform.position = v.pack3).clip,
    );

    TouchGestures.onTap().subscribe(() => {
        cancellation.cancel();
        a(cancellation).then(Diagnostics.log).catch(Diagnostics.log);
    });

    TouchGestures.onLongPress().subscribe(async () => {
        await cancellation.cancel();
        plane0.transform.x = 0;
        plane0.transform.y = 0;
    });
}

async function test_onUpdate() {
    const plane0 = await Scene.root.findFirst('plane0');

    const cancellation = PFTween.newClipCancellation();
    const a = PFTween.concat(
        new PFTween(0, .2, 1000).onUpdate(v => plane0.transform.x = v).clip,
        new PFTween(0, .2, 1000).onUpdate(v => plane0.transform.y = v).clip,
        new PFTween(.2, 0, 1000).onUpdate(v => plane0.transform.x = v).clip,
        new PFTween(.2, 0, 1000).onUpdate(v => plane0.transform.y = v).clip,
    );
    // const b = new PFTween(0, .1, 1000).onUpdate(v => plane0.transform.x = v).clip;

    TouchGestures.onTap().subscribe(() => {
        cancellation.cancel();
        a(cancellation).then(Diagnostics.log).catch(Diagnostics.log);
    });

    TouchGestures.onLongPress().subscribe(async () => {
        await cancellation.cancel();
        // await onSetSignalThen(plane0.transform.x);
        plane0.transform.x = 0;
        plane0.transform.y = 0;
    });
}

async function test_arrayOfNumber() {
    const plane1 = await Scene.root.findFirst('plane1');
    const from = await Scene.root.findFirst('from');
    const to = await Scene.root.findFirst('to');

    new PFTween(from.transform.position, to.transform.position, 1000)
        .setEase(Ease.easeInOutBack)
        .bind(v => plane1.transform.x = v.scalar)
        .apply();
}

async function test_arrayOfRotation() {
    const plane1 = await Scene.root.findFirst('plane1');
    const from = await Scene.root.findFirst('from');
    const to = await Scene.root.findFirst('to');

    new PFTween(from.transform.position, to.transform.position, 1000)
        .setEase(Ease.linear)
        .bind(v => plane1.transform.position = v.pack3)
        .apply();

    new PFTween(plane1.transform.rotation, plane1.transform.rotation, 1000)
        .setEase(Ease.linear)
        .bind(v => {
            plane1.transform.rotationZ = v.swizzle('x');
        })
        .apply();
}

async function test_arrayOfNumberSingle() {
    const plane1 = await Scene.root.findFirst('plane1');
    const from = await Scene.root.findFirst('from');
    const to = await Scene.root.findFirst('to');

    const cancellation = PFTween.newClipCancellation();
    const clip = new PFTween(from.transform.position, to.transform.position, 1000)
        .setEase(Ease.easeInOutBack)
        .onUpdate(v => plane1.transform.position = v.swizzle('xy0'))
        .clip;

    TouchGestures.onTap().subscribe(() => {
        clip(cancellation).then(Diagnostics.log).catch(Diagnostics.log);
    });

    TouchGestures.onLongPress().subscribe(() => {
        cancellation.cancel();
    })
}

// todo: this builder has been deleted.
const clip = new PFTween(0, 1, 1000).setId('name')

TouchGestures.onTap().subscribe(() => {
    clip.onUpdate(v => Diagnostics.log(v.rawValue)).setLoops().setMirror().apply();
    // new PFTween(0, 1, 1000).onUpdate(v => Diagnostics.log(v.rawValue)).setLoops().setMirror().setId('name').clip();
});

TouchGestures.onLongPress().subscribe(() => {
    PFTween.kill('name').catch(Diagnostics.log);
});