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

// grab DOM nodes
const $master = document.querySelector("#synth-master");
const $envelopeContainer = document.querySelector("#synth-env");
const $drumContainer = document.querySelector("#synth-drum");
const $fmContainer = document.querySelector("#fm-section");

// TODO setup master gain etc.

// TODO create model of our synth

// TODO play an fm note

// TODO play an envelope

// TODO define keyboard interactions

// TODO load buffers and play them

// TODO add AudioWorklet effect

console.log("hi");
