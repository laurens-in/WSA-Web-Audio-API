# Workshop Notes

## Description

The Web Audio API is the basis for all audio processing in the browser. We will look at how it works, what possibilities it offers and where it falls short.

The Web Audio API is the low-level API for audio processing in the browser. This means that even though you might not use it directly, every audio library or framework is going to rely on it under the hood. In this workshop we are going to look at what the Web Audio API has to offer, how it works and where it falls short. We will talk about when to use it and when to prefer high-level frameworks.

## First Meeting Notes

Continue:

- same time and date, same link https://virginia.zoom.us/wc/7145470413

Frame:

- 2 hours
- interactive

Topics:

1. A little bit about browser APIs in general (Becky)
   1. show some apis (drag&drop, fullscreen)
   2. How are they implemented, with what strategy and by whom, and why is it such a mess sometimes?
2. What is the Web Audio API and why should we care? (Becky)
3. Showing different nodes/functionality etc. (Laurens)
   1. binds to native code, see [this image](./assets/threads.png)
   2. has a-rate & k-rate
   3. sample accurate scheduling but fire & forget
   4. does not support some things we would expect from an audio framework (i.e. frequency domain processing)
4. Creating oscillators (maybe FM?) (Laurens)
5. Connecting them to gain, ramping parameters, envelopes etc. (Laurens)
6. Loading/playing samples (Becky)
   1. with `Promise.all` multiple files can be loaded "in parallel" (as much as things in js can run parallel that is), see below + [here](https://anotherdev.xyz/promise-all-runs-in-parallel/)
7. Scheduling (only briefly, too complicated for a short workshop) (Laurens)
   1. tale of two clocks brief explaination + maybe brief shoutout for zyklus
8. AudioWorklet (Becky)

-> Build _one thing_ during the whole workshop. Build an instrument that is an FM + some drum samples, playable by pressing keys. Include an AudioWorklet effect.

Useful links

- https://github.com/sebpiq/WAAClock
- https://github.com/chrisguttandin/standardized-audio-context
- https://github.com/cwilso/PitchDetect/blob/main/js/pitchdetect.js
- https://github.com/sebpiq/WAAClock/issues/20#issuecomment-1242066375 angry comment
- https://github.com/sebpiq/WebPd#using-the-web-compiler
- https://github.com/felixroos/zyklus
- https://gridsound.com/daw/
- https://github.com/WebAudio/web-audio-api/issues/248#issuecomment-740698581 comment "unreviewd spec"
- https://github.com/WebAudio/web-audio-api/issues/468#issuecomment-71942900 "i don't think fft is the goal?"
- https://github.com/WebAudio/web-audio-api/issues/468#issuecomment-71898352 "what is webaudio, who knows"
- https://github.com/orottier/web-audio-api-rs web audio outside the web
- https://github.com/ircam-ismm/sc-scheduling ircam scheduler, wip
- https://youtu.be/g1L4O1smMC0 video about worklets

Fetching multiple files (not tested, but should work along these lines):

```js
let sounds = [pathA, pathB, pathC];

const ctx = new window.AudioContext();
sounds.forEach((sound) =>
  fetch(sound)
    .then((response) => response.arrayBuffer())
    .then((buffer) => ctx.decodeAudioData(buffer))
);
Promise.all(sounds).then((buffers) => {
  buffers.foreEach((b) => {
    let track = ctx.createBufferSource();
    track.buffer = buffer;
    track.connect(ctx.destination);
    track.start(ctx.currentTime);
  });
});
```
