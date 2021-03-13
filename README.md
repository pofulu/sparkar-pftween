# ⚠️
> You are in **develop** branch.



# PFTween.ts

![index](https://github.com/pofulu/sparkar-pftween/blob/master/README.assets/index.gif?raw=true)

**PFTween** is a wrapped Spark AR animation script package.

You can use the similar syntax to [DOTween](http://dotween.demigiant.com) to create animation with JavaScript in Spark AR.


## Install

[![NPM](https://nodei.co/npm/sparkar-pftween.png)](https://npmjs.org/package/sparkar-pftween)

You can import this package to your Spark AR project directly or use this with npm.

### Import

0. [Download PFTween](https://github.com/pofulu/sparkar-pftween/raw/develop/PFTweenDemo/scripts/PFTween.ts) (Right click and Save as)
1. Drag/Import to Assets category in Spark AR. (Spark AR support multiple script files after [v75](https://sparkar.facebook.com/ar-studio/learn/documentation/changelog#75))
2. Import `Ease` and `PFTween` module at the top of your script.
    ```javascript
    import { Ease, PFTween } from './PFTween';

    // Your script...
    ```


3. You can also [Click Here to Download Sample Projects](https://yehonal.github.io/DownGit/#home?url=https://github.com/pofulu/sparkar-pftween/tree/master/PFTweenDemo).



### npm(WIP)

0. Add package with npm or yarn

    ```
    npm i sparkar-pftween
    ```
    or
    ```
    yarn add sparkar-pftween
    ```
1. Import `Ease` and `PFTween` module at the top of your script.
  
    ```javascript
    import { Ease, PFTween } from 'sparkar-pftween';
	```



## Usage

There are three ways to use PFTween.

### 1. Basic

```javascript
const Scene = require('Scene'); 

(async () => {
    const plane0 = await Scene.root.findFirst('plane0');
    plane0.transform.x = new PFTween(-0.2, 0.2, 1000).scalar;
})();
```

### 2. Reusable

```js
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');

(async () => {
    const plane0 = await Scene.root.findFirst('plane0');
    const animation = new PFTween(-0.2, 0.2, 1000)
        .onStart(v => plane0.transform.x = v.scalar)
        .apply();

    TouchGestures.onTap().subscribe(() => animaiton.replay());
})();
```

### 3. Clip - Play Animations in Sequence

```js 
const Scene = require('Scene');
const TouchGestures = require('TouchGestures');
const Diagnostics = require('Diagnostics');

(async () => {
    const plane0 = await Scene.root.findFirst('plane0');

    await new PFTween(0, 0.2, 500).onStart(v => plane0.transform.x = v.scalar).clip();
    await new PFTween(0, 0.1, 500).onStart(v => plane0.transform.y = v.scalar).clip();
    await new PFTween(0.2, 0, 500).onStart(v => plane0.transform.x = v.scalar).clip();
})();
```



## Donations
If this is useful for you, please consider a donation🙏🏼. One-time donations can be made with PayPal.

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HW99ESSALJZ36)
