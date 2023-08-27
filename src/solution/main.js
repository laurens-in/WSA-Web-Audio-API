import {
  createEnvelopeSection,
  createFmVoiceSection,
  createMasterSection,
  createPadSection,
} from "../util/ui";
import kick from "../assets/sounds/kick.wav";
import snare from "../assets/sounds/snare.wav";
import ride from "../assets/sounds/ride.wav";
import closedHat from "../assets/sounds/closedHat.wav";

const ctx = new AudioContext();
document.addEventListener("click", () => ctx.resume());

// create a master gain
const masterGain = ctx.createGain();
// connect master gain to output
masterGain.connect(ctx.destination);

// add slider to ui
const $master = document.querySelector("#synth-master");
const masterSection = createMasterSection(masterGain, ctx);
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
        depth: 1,
      },
      refs: undefined,
    },
    {
      freq: 330,
      amp: 0.5,
      modulator: {
        index: 0.125,
        depth: 0.6,
      },
      refs: undefined,
    },
    {
      freq: 300,
      amp: 0.5,
      modulator: {
        index: 0.2,
        depth: 0.7,
      },
      refs: undefined,
    },
    {
      freq: 270,
      amp: 0.5,
      modulator: {
        index: 0.66,
        depth: 0.9,
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
      playBuffer(instrument.buffers.kick, masterGain, ctx);
    },
  },
  {
    name: "Snare",
    callback: () => {
      playBuffer(instrument.buffers.snare, masterGain, ctx);
    },
  },
  {
    name: "Ride",
    callback: () => {
      playBuffer(instrument.buffers.ride, masterGain, ctx);
    },
  },
  {
    name: "Closed Hat",
    callback: () => {
      playBuffer(instrument.buffers.closedHat, masterGain, ctx);
    },
  },
]);
$drumContainer.appendChild(padSection);

const $fmContainer = document.querySelector("#fm-section");
const voiceSections = instrument.voices.map((v, i) =>
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
        voice.refs = playFmVoice(voice, instrument.envelope, ctx);
      }

      if (e.key === k && voice.refs.dirty === false) {
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

Promise.all(sounds).then((buffers) => {
  instrument.buffers = {
    kick: buffers[0],
    snare: buffers[1],
    ride: buffers[2],
    closedHat: buffers[3],
  };
});
