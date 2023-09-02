## Web Audio API workshop

---

### Plan

1. Basic intro (browser APIs + the web audio API)
2. Essential things you should know about the web audio API
3. Creating oscillators
4. Dealing with parameters
5. Loading/playing samples
6. If we can: scheduling
7. Basic introduction to AudioWorklets

---

### What is an API?

- stands for **Application Programming Interface.**
- abstracts a complex problem (i.e., doing 3D graphics, network programming, etc) into simple-to-use functions
- generally accessed through a parent object that groups all functions for a single API

---

### Browser APIs vs Third-Party APIs?

**Browser APIs** are discussed and approved by the W3 Consortium, and are expected to be implemented **by each browser**, using the same common API functions. (i.e., web audio API)

**Third-party APIs** are built on top of these browser APIs, often to make them easier to use or to streamline cross-browser support. (i.e., Tone.js, p5.sound, Howler.js)

---

### Browser API examples

- DOM API (essential: manipulate page contents!)
- Fetch API (make requests for fetching external data)
- Canvas and WebGL APIs (2D/3D drawing)
- History API (move back/forward in user's browser history)
- Intersection Observer API (when x element is at center of screen, do y)

Full list available at: [https://developer.mozilla.org/en-US/docs/Web/API](https://developer.mozilla.org/en-US/docs/Web/API)

---

### Third-party API examples

- Underscore.js
- axios.js
- p5.js + three.js
- scrollama.js

---

### What is the Web Audio API?

The Web Audio API is a **browser API** for playing and manipulating audio, which can incorporate oscillators, pre-made samples, basic audio effects, recording, user interactions, and metering.

---

### Original intentions

![[w3c-waapi-intention.png]]

---

### Why should we care?

- The WAAPI is a **browser API**, meaning browsers will continue to support it as long as it continues to be in the W3C spec.
- **Third-party APIs**, like Tone.js remain only if their (often solo) developer has time to maintain it.

---

### Why should we care?

- If there's something not available to you in Tone.js, p5.sound, etc., these libraries include a way to add WAAPI functionality via custom nodes.
- The WAAPI has a lot of strange quirks, which are easier to find through the API directly than on third-party libraries built on top of it.

---

### Basics: the audio graph

![[threads.png]]

---

### Basics: the audio graph

Source -> Effects -> Destination

---

### Sources: Oscillator

```js
// create web audio api context
const ctx = new (window.AudioContext || window.webkitAudioContext)();

// create Oscillator node
const oscillator = audioCtx.createOscillator();

oscillator.type = "square";
oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // value in hertz
oscillator.connect(ctx.destination);
oscillator.start();
```

---

### Sources: Samples

* `AudioBuffer`: holds a loaded sample in memory, sticks around
* `AudioBufferSourceNode`: plays the `AudioBuffer`, dies immediately after
* [involves buffer format conversion](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#planar_versus_interleaved_buffers)

---

### Sources: Samples

```js
// load all sounds
let allSounds = [];

const paths = ["path1.wav", "path2.wav"];
const sounds = paths.map((sound) =>
  fetch(sound)
    .then((response) => response.arrayBuffer())
    .then((buffer) => ctx.decodeAudioData(buffer))
);

Promise.all(sounds).then((buffers) => {
  allSounds = buffers;
});
```

---

### Sources: Samples

`AudioBuffer` (memory) vs `AudioBufferSourceNode` (playback)

```js
// play one sound back
const track = ctx.createBufferSource();
track.buffer = allSounds[0];
track.connect(destination);
track.start(ctx.currentTime);
```

---

### Adjusting: AudioParams

```js
oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 2);
oscillator.frequency.value = 440; // low internal priority
```

* audio-rate (a-rate): happens for every individual sample frame
* control-rate (k-rate): happens on each block of 128 frames

---

## Coding

---

### Strange quirks

- browser processing power
- time accuracy (JS clock vs WAAPI clock)
- memory allocation + garbage collection
- missing tools (i.e., frequency domain)
- no interactions with SpeechSynthesis

[I don't know who the Web Audio API is designed for](https://blog.mecheye.net/2017/09/i-dont-know-who-the-web-audio-api-is-designed-for/)

---

### Notes on scheduling
