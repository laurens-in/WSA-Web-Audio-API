import { createNamedSlider } from "../util/ui";

// create a mental model of our synth
// const fmSynth = {
//   envelop: {
//     a: 0.1,
//     d: 0.1,
//     s: 0.1,
//     r: 0.1,
//   },
//   voices: [
//     {
//       carrier: {
//         freq: 100,
//       },
//       modulator: {
//         freq: 20,
//         amplitude: 0,
//       },
//       gain: 1,
//     },
//   ],
// };

// add slider to ui
const $master = document.querySelector("#synth-master");
$master.appendChild(
  createNamedSlider(
    "Master",
    "master-slider",
    () => console.log("hi"),
    0,
    1,
    0.01,
    0,
    200
  )
);
