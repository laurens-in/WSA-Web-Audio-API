import {
  createEnvelopeSection,
  createFmVoiceSection,
  createMasterSection,
  createNamedPad,
  createNamedSlider,
} from "../util/ui";
import kick from "../assets/sounds/kick.wav";
import snare from "../assets/sounds/snare.wav";
import hhOpen from "../assets/sounds/hh-open.wav";
import hhClosed from "../assets/sounds/hh-closed.wav";

const ctx = new AudioContext();
document.addEventListener("click", () => ctx.resume());
const masterGain = ctx.createGain();
// connect master gain to output
masterGain.connect(ctx.destination);

// add slider to ui
const $master = document.querySelector("#synth-master");
const masterSection = createMasterSection(masterGain, ctx);
$master.appendChild(masterSection);

// make a mental model of fmSynth
const fmSynth = {
  envelope: {
    attack: 0.05, // time
    decay: 0.1, // time
    sustain: 0.3, // level
    release: 1, // time
  },
  voices: [
    {
      freq: 300,
      amp: 1,
      modulator: {
        index: 0.2,
        depth: 300,
      },
      refs: undefined,
    },
    {
      freq: 300,
      amp: 1,
      modulator: {
        index: 0.2,
        depth: 300,
      },
      refs: undefined,
    },
    {
      freq: 300,
      amp: 1,
      modulator: {
        index: 0.2,
        depth: 300,
      },
      refs: undefined,
    },
    {
      freq: 300,
      amp: 1,
      modulator: {
        index: 0.2,
        depth: 300,
      },
      refs: undefined,
    },
  ],
};

const $envelopeContainer = document.querySelector("#synth-env");
const envelopeSection = createEnvelopeSection(fmSynth.envelope);
$envelopeContainer.appendChild(envelopeSection);

const $drumContainer = document.querySelector("#synth-drum");
const padSection = createNamedPad("Kick", "kick", () => console.log("hi"));
$drumContainer.appendChild(padSection[0]);

const $fmContainer = document.querySelector("#fm-section");
const voiceSections = fmSynth.voices.map((v, i) =>
  createFmVoiceSection(v, i, ctx)
);
voiceSections.forEach((el) => $fmContainer.appendChild(el));

const playFmVoice = (voice, env, ctx) => {
  // create nodes
  const carrier = ctx.createOscillator();
  const amplitude = ctx.createGain();
  const modulator = ctx.createOscillator();
  const modAmp = ctx.createGain();
  const envelope = createEnvelope(env, ctx);
  // set values
  carrier.frequency.setValueAtTime(voice.freq, ctx.currentTime);
  modulator.frequency.setValueAtTime(
    voice.modulator.index * voice.freq,
    ctx.currentTime
  );
  amplitude.gain.setValueAtTime(voice.amp, ctx.currentTime);
  modAmp.gain.setValueAtTime(voice.modulator.depth, ctx.currentTime);
  // wire everything up
  modulator.connect(modAmp);
  modAmp.connect(carrier.detune);
  carrier.connect(envelope);
  envelope.connect(amplitude);
  amplitude.connect(masterGain);
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
  const release = ctx.currentTime + env.release;
  // we need this to avoid clicks, but we shouldn't
  const buffer = 0.05;
  voice.refs.env.gain.linearRampToValueAtTime(
    env.sustain,
    ctx.currentTime + buffer
  );
  voice.refs.env.gain.linearRampToValueAtTime(0, release + buffer);
  voice.refs.freq.stop(release + buffer);
  voice.refs.modulator.index.stop(release + buffer);
  return null;
};

// ramps that are triggered while other ramps are still going are appended to the queue, it still sometimes breaks
const createEnvelope = (env, ctx) => {
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

const initializeKeyboard = () => {
  const keysFM = ["a", "s", "d", "f"];
  keysFM.forEach((k, i) => {
    const voice = fmSynth.voices[i];
    document.addEventListener("keydown", (e) => {
      if (e.key === k && !voice.refs) {
        voice.refs = playFmVoice(voice, fmSynth.envelope, ctx);
      }

      if (e.key === k && voice.refs.dirty === false) {
        voice.refs = stopFmVoice(voice, fmSynth.envelope, ctx);
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.key === k && voice.refs && voice.refs.dirty) {
        voice.refs.dirty = false;
      }
    });
  });
};

initializeKeyboard();

// drum
const paths = [kick, snare, hhClosed, hhOpen];

// create a bunch of promises
const sounds = paths.map((sound) =>
  fetch(sound)
    .then((response) => response.arrayBuffer())
    .then((buffer) => ctx.decodeAudioData(buffer))
);

// wait for promises to resolve and get the buffers
Promise.all(sounds).then((buffers) => {
  buffers.forEach((buffer, i) => {
    console.log(buffer);
    let track = ctx.createBufferSource();
    track.buffer = buffer;
    track.connect(ctx.destination);
    track.start(ctx.currentTime + i);
  });
});
