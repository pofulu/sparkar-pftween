# ⚠️
> You are in **develop** branch.



# PFTween

![index](https://github.com/pofulu/sparkar-pftween/blob/master/README.assets/index.gif?raw=true)

**PFTween** is a Spark AR library for tweening animation.

You can use the similar syntax to [DOTween](http://dotween.demigiant.com) to create animation with JavaScript/TypeScript in Spark AR.

## Install

[![NPM](https://nodei.co/npm/sparkar-pftween.png?compact=true)](https://nodei.co/npm/sparkar-pftween.png?compact=true)

You can download script and import it into your Spark AR project, or use this with npm.

0. [Download PFTween.ts](https://github.com/pofulu/sparkar-pftween/releases/latest/download/PFTween.ts)

1. Drag/Import it into your project. ([Spark AR support TypeScript since v105](https://sparkar.facebook.com/ar-studio/learn/scripting/typescript-support))
2. Import `Ease` and `PFTween` module at the top of your script.
    ```javascript
    import { Ease, PFTween } from './PFTween';
    ```


3. You can also [Click Here to Download Sample Project](https://github.com/pofulu/sparkar-pftween/releases/latest/download/PFTweenDemo.arprojpkg).



## Usage

### Create Animation

There are three ways to create animation with PFTween.

#### 1. Basic - Simple and Easy

Create and use animation at once.

```typescript
import { PFTween } from './PFTween';
import Scene from 'Scene';

(async () => {
	const plane0 = await Scene.root.findFirst('plane0');
	plane0.transform.x = new PFTween(-0.2, 0.2, 1000).scalar;
})();
```

#### 2. Reusable - Better Performance

Create and  reuse/control it latter, such as `stop()`, `start()`,`repaly()`......

```typescript
import { PFTween } from './PFTween';
import Scene from 'Scene';
import TouchGestures from 'TouchGestures';

(async () => {
  const plane0 = await Scene.root.findFirst('plane0');
  const animation = new PFTween(-0.2, 0.2, 1000)
		.onStart(v => plane0.transform.x = v.scalar)
		.build();

  TouchGestures.onTap().subscribe(() => animaiton.replay());
})();
```

#### 3. Clip - Play Animations in Sequence

Create then play tweens in sequence, or at the same time. And you can await the them to finish.

```typescript
import { PFTween } from './PFTween';
import Scene from 'Scene';
import Diagnostics from 'Diagnostics';

(async () => {
  const plane0 = await Scene.root.findFirst('plane0');
  const clip1 = new PFTween(0, 0.2, 500).onStart(v => plane0.transform.x = v.scalar).clip;
  const clip2 = new PFTween(0, 0.1, 500).onStart(v => plane0.transform.y = v.scalar).clip;
  const clip3 = new PFTween(0.2, 0, 500).onStart(v => plane0.transform.x = v.scalar).clip;

  // The "combine" and "concat" are static functions
  const combine = PFTween.combine(clip1, clip2);
  const sequence = PFTween.concat(combine, clip3);

  Diagnostics.log('Play');
	await sequence();
  Diagnostics.log('Finish');
})();
```



### More Functions

You can add **Ease**, **Delay**, **Loops** or callback for **Events** by chaining functions.

```typescript
import { PFTween, Ease } from './PFTween';

new PFTween(0, 1, 1000)
  .setEase(Ease.easeInOutSine)
	.setLoops(5, true)		// "true" means mirror loop, or you can use .setMirror()
	.setDelay(1000)				// Delay 1 second to start
	.onComplete(() => {})	// Invoke when animation finish
	.onLoop(iter => {})		// Invoke when loops, 
	.onUpdate(n => {})		// Invoke when animation play, the callback vlaue type is "number"
	.swizzle('xxxy')			// Take input numbers and output them in a different order
```

There are more convenient and quick-to-use functions.

```typescript
import { PFTween, Ease } from './PFTween';
import Scene from 'Scene';
import Materials from 'Materials';

(async () => {
	const plane0 = await Scene.root.findFirst('plane0');
  const material0 = await Materials.findFirst('material0');
  
  new PFTween(0, 1, 1000)
		.onStartVisible(plane0)
    .onStartHidden(plane0)
    .onCompleteVisible(plane0)
    .onCompleteHidden(plane0)
    .onCompleteResetPosition(plane0)
    .onCompleteResetRotation(plane0)
    .onCompleteResetScale(plane0)
    .onCompleteResetOpacity(material0)
    .onAnimatingVisibleOnly(plane0)
    .build()
})();
```



### Stop Animation

#### 1. With Reusable Tween

If your animation is made with `.build()`, it's will return a controller. You can stop the animation with controller's  `stop()` function.

```typescript
import { PFTween } from './PFTween';
import Scene from 'Scene';
import TouchGestures from 'TouchGestures';

(async () => {
  const plane0 = await Scene.root.findFirst('plane0');
 
  const controller = new PFTween(0, 1, 1000)
  	.setLoops(true)
  	.setId('foo')
    .onStart(v => plane0.transform.x = v.scalar)
    .build();
  
  TouchGestures.onTap().subscribe(() => {
    controller.stop();
  });
})();
```



#### 2. Set ID

You can add `.setId("id")`  to any of your tween, and then use the static function `PFTween.kill("id")` to kill and stop the animation. **Please note** that if you kill the animation, all of the events will be removed. (The animation you killed can't be reused)

```typescript
import { PFTween } from './PFTween';
import Scene from 'Scene';
import TouchGestures from 'TouchGestures';

(async () => {
  const plane0 = await Scene.root.findFirst('plane0');
  
	plane0.transform.x = new PFTween(0, 1, 1000).setLoops(true).setId('foo').scalar;
  
  TouchGestures.onTap().subscribe(() => PFTween.kill('foo'));
})();
```

If your animation is created with basic way such `.scalar`, `.pack2`, `.pack3`...... The animation will be auto killed after complete.



#### 3. Clip Cancellation

If you animation is made with `.clip`, you can create a cancellationa and pass it when you play the clip.

```typescript
import { PFTween } from './PFTween';
import Scene from 'Scene';
import TouchGestures from 'TouchGestures';

(async () => {
  const plane0 = await Scene.root.findFirst('plane0');
  
  // PFTween.newCancellation is static function
  const cancellation = PFTween.newClipCancellation();
  
  new PFTween(0, 1, 1000)
  	.setLoops(true)
    .onStart(v => plane0.transform.x = v.scalar)
    .clip(cancellation);
  
  TouchGestures.onTap().subscribe(() => {
    cancellation.cancel();
  });
})();
```

Unlike `setId`/`kill`, canceled clips can be played again, and all events you added will remain.



## Donations
If this is useful for you, please consider a donation🙏🏼. One-time donations can be made with PayPal.

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HW99ESSALJZ36)
