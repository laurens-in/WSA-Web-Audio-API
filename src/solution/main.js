import { createFmVoice, createNamedSlider } from "../util/ui";
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
$master.appendChild(
  createNamedSlider(
    "Master",
    "master-slider",
    (v) => masterGain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.02),
    {
      min: 0,
      max: 1,
      step: 0.01,
    }
  )
);

// start with this
// const fmSynth = {
//   envelope: {
//     attack: 0.1, // time
//     decay: 0.3, // time
//     sustain: 0.8, // level
//     release: 0.2, // time
//   },
//   voices: [
//     {
//       carrier: {
//         freq: 400,
//         amp: 1,
//       },
//       modulator: {
//         index: 1.2,
//         amp: 100,
//       },
//       refs: undefined,
//     },
//   ],
// };

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
      carrier: {
        freq: 300,
        amp: 1,
      },
      modulator: {
        index: 0.2,
        depth: 300,
      },
      refs: undefined,
    },
    {
      carrier: {
        freq: 400,
        amp: 1,
      },
      modulator: {
        index: 1.75,
        depth: 300,
      },
      refs: undefined,
    },
    {
      carrier: {
        freq: 600,
        amp: 1,
      },
      modulator: {
        index: 0.5,
        depth: 250,
      },
      refs: undefined,
    },
    {
      carrier: {
        freq: 200,
        amp: 1,
      },
      modulator: {
        index: 2.6,
        depth: 300,
      },
      refs: undefined,
    },
  ],
};

const $envelope = document.querySelector("#synth-env");
$envelope.appendChild(
  createNamedSlider(
    "Attack",
    "attack-slider",
    (v) => {
      fmSynth.envelope.attack = v;
    },
    { min: 0, max: 0.5, step: 0.01, initial: 0.05, height: 75 }
  )
);
$envelope.appendChild(
  createNamedSlider(
    "Decay",
    "decay-slider",
    (v) => {
      fmSynth.envelope.decay = v;
    },
    { min: 0, max: 0.5, step: 0.01, initial: 0.05, height: 75 }
  )
);
$envelope.appendChild(
  createNamedSlider(
    "Sustain",
    "sustain-slider",
    (v) => {
      fmSynth.envelope.sustain = v;
    },
    { min: 0, max: 1, step: 0.01, initial: 0.75, height: 75 }
  )
);

$envelope.appendChild(
  createNamedSlider(
    "Release",
    "release-slider",
    (v) => {
      fmSynth.envelope.release = v;
    },
    { min: 0, max: 2, step: 0.01, initial: 0.5, height: 75 }
  )
);

const fmContainer = document.querySelector("#synth-fm");
const voice = createFmVoice(fmSynth.voices[0], 1, ctx);
fmContainer.appendChild(voice);

const playFmVoice = (voice, envelope, ctx) => {
  // create nodes
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modAmp = ctx.createGain();
  const env = createEnvelope(envelope, ctx);
  // set values
  carrier.frequency.setValueAtTime(voice.carrier.freq, ctx.currentTime);
  modulator.frequency.setValueAtTime(
    voice.modulator.index * voice.carrier.freq,
    ctx.currentTime
  );
  modAmp.gain.setValueAtTime(voice.modulator.depth, ctx.currentTime);
  // connect
  modulator.connect(modAmp);
  modAmp.connect(carrier.detune);
  carrier.connect(env);
  env.connect(masterGain);
  carrier.start(ctx.currentTime);
  modulator.start(ctx.currentTime);
  return [carrier, modulator, env];
};

const stopFmVoice = (refs, envelope, ctx) => {
  const release = ctx.currentTime + envelope.release;
  const buffer = 0.05;
  refs.env.gain.linearRampToValueAtTime(
    envelope.sustain,
    ctx.currentTime + buffer
  );
  refs.env.gain.linearRampToValueAtTime(0, release + buffer);
  refs.oscillators.forEach((v) => v.stop(release + buffer));
};

// This can fail (i think) when sustain is release is triggered before decay, then weird shit happens, it works fine with short attacks
const createEnvelope = (envelope, ctx) => {
  const env = ctx.createGain();
  // attack
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.95, ctx.currentTime + envelope.attack);
  // decay
  env.gain.linearRampToValueAtTime(
    envelope.sustain,
    ctx.currentTime + envelope.attack + envelope.decay
  );
  return env;
};

// start with this!
// const initializeKeyboard = () => {
//   document.addEventListener("keypress", (e) => {
//     if (e.key === "a" && !fmSynth.voices[0].refs) {
//       fmSynth.voices[0].refs = playFmVoice(fmSynth.voices[0], {}, ctx);
//     }
//   });

//   document.addEventListener("keyup", (e) => {
//     if (e.key === "a" && fmSynth.voices[0].refs) {
//       fmSynth.voices[0].refs.forEach((v) => v.stop());
//       fmSynth.voices[0].refs = undefined;
//     }
//   });
// };

const initializeKeyboard = () => {
  const keys = ["a", "s", "d", "f"];
  document.addEventListener("keydown", (e) => {
    keys.forEach((k, i) => {
      const voice = fmSynth.voices[i];

      if (e.key === k && !fmSynth.voices[i].refs) {
        const [carrier, modulator, envelope] = playFmVoice(
          voice,
          fmSynth.envelope,
          ctx
        );

        // this doesn't work because it will instantly stop on keyup we need to debounce
        // refs[k] = { oscillators: [carrier, modulator], env: envelope })

        // setTimeout(
        //   () =>
        //     (refs[k] = { oscillators: [carrier, modulator], env: envelope }),
        //   50
        // );

        fmSynth.voices[i].refs = {
          oscillators: [carrier, modulator],
          env: envelope,
          dirty: true,
        };
      }

      if (e.key === k && fmSynth.voices[i].refs.dirty === false) {
        stopFmVoice(fmSynth.voices[i].refs, fmSynth.envelope, ctx);
        fmSynth.voices[i].refs = undefined;
      }
    });
  });

  // like this it's not possible to change values whlie playing since mouse is blocked
  // document.addEventListener("keyup", (e) => {
  //   keys.forEach((k, i) => {
  //     if (e.key === k && refs[k]) {
  //       stopFmVoice(refs[k], fmSynth.envelope, ctx);
  //       refs[k] = undefined;
  //     }
  //   });
  // });
  document.addEventListener("keyup", (e) => {
    keys.forEach((k, i) => {
      if (
        e.key === k &&
        fmSynth.voices[i].refs &&
        fmSynth.voices[i].refs.dirty
      ) {
        fmSynth.voices[i].refs.dirty = false;
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
