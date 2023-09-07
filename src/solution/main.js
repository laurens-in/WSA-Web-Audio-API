import {
  createEnvelopeSection,
  createFmVoiceSection,
  createPadSection,
  createSliderSection,
} from "../util/ui";
import kick from "../assets/sounds/kick.wav";
import snare from "../assets/sounds/snare.wav";
import ride from "../assets/sounds/ride.wav";
import closedHat from "../assets/sounds/closedHat.wav";
import { AudioContext, AudioWorkletNode } from "standardized-audio-context";

const ctx = new AudioContext();
// don't do this IRL
document.addEventListener("click", () => ctx.resume());

// create a master gain
const masterGain = ctx.createGain();
// connect master gain to output
masterGain.connect(ctx.destination);

// AudioWorklet effect
await ctx.audioWorklet.addModule("../worklet/foldback.js");
const foldbackDist = new AudioWorkletNode(ctx, "foldback-distortion-processor");
foldbackDist.connect(masterGain);

// pre master, from here we go into effects
const masterChain = ctx.createGain();
masterChain.connect(foldbackDist);

// add slider to ui
const $master = document.querySelector("#synth-master");

const masterSection = createSliderSection(
  [
    {
      name: "Dist. Thresh.",
      id: "foldback-slider",
      callback: (v) =>
        foldbackDist.parameters
          .get("threshold")
          .linearRampToValueAtTime(v, ctx.currentTime + 0.02),
      config: { min: 0.01, max: 1, step: 0.01, initial: 1 },
    },
    {
      name: "Master",
      id: "master-slider",
      callback: (v) =>
        masterGain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.02),
      config: { min: 0, max: 1, step: 0.01, initial: 0 },
    },
  ],
  "Master Section"
);
$master.appendChild(masterSection);

// make a mental model of fmSynth
const instrument = {
  envelope: {
    attack: 0.05, // time
    decay: 0.1, // time
    sustain: 0.3, // level
    release: 1, // time
  },
  voices: [
    {
      freq: 300,
      amp: 0.5,
      modulator: {
        index: 0.5,
        depth: 500,
      },
      refs: undefined,
    },
    {
      freq: 330,
      amp: 0.5,
      modulator: {
        index: 0.125,
        depth: 300,
      },
      refs: undefined,
    },
    {
      freq: 300,
      amp: 0.5,
      modulator: {
        index: 0.2,
        depth: 350,
      },
      refs: undefined,
    },
    {
      freq: 270,
      amp: 0.5,
      modulator: {
        index: 0.66,
        depth: 450,
      },
      refs: undefined,
    },
  ],
  buffers: {
    kick: undefined,
    snare: undefined,
    ride: undefined,
    closedHat: undefined,
  },
};

const $envelopeContainer = document.querySelector("#synth-env");
const envelopeSection = createEnvelopeSection(instrument.envelope);
$envelopeContainer.appendChild(envelopeSection);

const $drumContainer = document.querySelector("#synth-drum");
const [padSection, padRefs] = createPadSection([
  {
    name: "Kick",
    callback: () => {
      playBuffer(instrument.buffers.kick, masterChain, ctx);
    },
  },
  {
    name: "Snare",
    callback: () => {
      playBuffer(instrument.buffers.snare, masterChain, ctx);
    },
  },
  {
    name: "Ride",
    callback: () => {
      playBuffer(instrument.buffers.ride, masterChain, ctx);
    },
  },
  {
    name: "Closed Hat",
    callback: () => {
      playBuffer(instrument.buffers.closedHat, masterChain, ctx);
    },
  },
]);
$drumContainer.appendChild(padSection);

const $fmContainer = document.querySelector("#fm-section");
const voiceSections = instrument.voices.map((v, i) =>
  createFmVoiceSection(v, i, ctx)
);
voiceSections.forEach((el) => $fmContainer.appendChild(el));

const startFmVoice = (voice, env, destination, ctx) => {
  // create carrier
  const carrier = ctx.createOscillator();
  carrier.frequency.setValueAtTime(voice.freq, ctx.currentTime);
  // create amplitude
  const amplitude = ctx.createGain();
  amplitude.gain.setValueAtTime(voice.amp, ctx.currentTime);
  // create modulator index
  const modulator = ctx.createOscillator();
  modulator.frequency.setValueAtTime(
    voice.modulator.index * voice.freq,
    ctx.currentTime
  );
  // create modulator depth
  const modAmp = ctx.createGain();
  modAmp.gain.setValueAtTime(voice.modulator.depth, ctx.currentTime);
  // create envelope
  const envelope = startEnvelope(env, ctx);

  // wire everything up
  modulator.connect(modAmp);
  modAmp.connect(carrier.detune);
  carrier.connect(envelope);
  envelope.connect(amplitude);
  amplitude.connect(destination);
  carrier.start(ctx.currentTime);
  modulator.start(ctx.currentTime);
  return {
    freq: carrier,
    amp: amplitude,
    modulator: { index: modulator, depth: modAmp },
    env: envelope,
    dirty: true,
  };
};

const stopFmVoice = (voice, env, ctx) => {
  // we need this to avoid clicks, but we shouldn't
  stopEnvelope(voice.refs.env, env, ctx);
  voice.refs.modulator.index.stop(ctx.currentTime + env.release);
  return null;
};

// ramps that are triggered while other ramps are still going are appended to the queue, it still sometimes breaks
const startEnvelope = (env, ctx) => {
  const envelope = ctx.createGain();
  // attack
  envelope.gain.setValueAtTime(0, ctx.currentTime);
  envelope.gain.linearRampToValueAtTime(0.95, ctx.currentTime + env.attack);
  // decay
  envelope.gain.linearRampToValueAtTime(
    env.sustain,
    ctx.currentTime + env.attack + env.decay
  );
  return envelope;
};

const stopEnvelope = (envRef, env, ctx) => {
  // this prevents clicks don't ask me why
  envRef.gain.linearRampToValueAtTime(env.sustain, ctx.currentTime);
  // trigger release
  envRef.gain.linearRampToValueAtTime(0, ctx.currentTime + env.release);
  return null;
};

const playBuffer = (buffer, destination, ctx) => {
  const track = ctx.createBufferSource();
  track.buffer = buffer;
  track.connect(destination);
  track.start(ctx.currentTime);
};

const initializeKeyboard = () => {
  const keysFM = ["a", "s", "d", "f"];
  keysFM.forEach((k, i) => {
    const voice = instrument.voices[i];
    document.addEventListener("keydown", (e) => {
      if (e.key === k && !voice.refs) {
        voice.refs = startFmVoice(voice, instrument.envelope, masterChain, ctx);
      }

      if (e.key === k && voice.refs.dirty === false) {
        // we drop our refs, so that they can be garbage-collected
        voice.refs = stopFmVoice(voice, instrument.envelope, ctx);
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.key === k && voice.refs && voice.refs.dirty) {
        voice.refs.dirty = false;
      }
    });
  });

  const drumKeys = ["v", "b", "n", "m"];
  drumKeys.forEach((k, i) => {
    document.addEventListener("keydown", (e) => {
      if (e.key === k) {
        padRefs[i].click();
      }
    });
  });
};

initializeKeyboard();

// drum
const paths = [kick, snare, ride, closedHat];

// create a bunch of promises
const sounds = paths.map((sound) =>
  fetch(sound)
    .then((response) => response.arrayBuffer())
    .then((buffer) => ctx.decodeAudioData(buffer))
);

// load sounds in parallel
Promise.all(sounds).then((buffers) => {
  instrument.buffers = {
    kick: buffers[0],
    snare: buffers[1],
    ride: buffers[2],
    closedHat: buffers[3],
  };
});
