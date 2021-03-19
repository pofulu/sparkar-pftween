# ⚠️
> You are in **develop** branch.



# PFTween.ts

![index](https://github.com/pofulu/sparkar-pftween/blob/master/README.assets/index.gif?raw=true)

**PFTween** is a wrapped Spark AR animation script package.

You can use the similar syntax to [DOTween](http://dotween.demigiant.com) to create animation with JavaScript in Spark AR.


## Install

[![NPM](https://nodei.co/npm/sparkar-pftween.png?compact=true)](https://nodei.co/npm/sparkar-pftween.png?compact=true)

You can download script and import it into your Spark AR project, or use this with npm.

### Import

0. [Download PFTween.ts](https://github.com/pofulu/sparkar-pftween/raw/develop/PFTweenDemo/scripts/PFTween.ts) (Right click and Save as)

1. Drag/Import it into your project. ([Spark AR support TypeScript since v105](https://sparkar.facebook.com/ar-studio/learn/scripting/typescript-support))
2. Import `Ease` and `PFTween` module at the top of your script.
    ```javascript
    import { Ease, PFTween } from './PFTween';
    
    // Your script...
    ```


3. You can also [Click Here to Download Sample Project](https://github.com/pofulu/sparkar-pftween/releases/latest/download/PFTweenDemo.arprojpkg).



## Usage

### Create Animation

Three ways to create animation with PFTween.

#### 1. Basic

Create and use once.

```javascript
const Scene = require('Scene'); 

(async () => {
    const plane0 = await Scene.root.findFirst('plane0');
    plane0.transform.x = new PFTween(-0.2, 0.2, 1000).scalar;
})();
```

#### 2. Reusable

Create and you can reuse/control it with `stop()`, `start()`,`repaly()`......

```js
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');

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

```js 
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');
const Diagnostics = require('Diagnostics');

(async () => {
    const plane0 = await Scene.root.findFirst('plane0');
    const a = new PFTween(0, 0.2, 500).onStart(v => plane0.transform.x = v.scalar).clip;
    const b = new PFTween(0, 0.1, 500).onStart(v => plane0.transform.y = v.scalar).clip;
    const c = new PFTween(0.2, 0, 500).onStart(v => plane0.transform.x = v.scalar).clip;
    const combine = PFTween.combine(a, b);
    const sequence = PFTween.concat(combine, c);

    Diagnostics.log('Play');
	await sequence();
    Diagnostics.log('Finish');
})();
```



### More

#### Add Ease, Delay, Loops, Callback for Events......





## Donations
If this is useful for you, please consider a donation🙏🏼. One-time donations can be made with PayPal.

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HW99ESSALJZ36)
