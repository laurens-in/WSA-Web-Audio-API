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

const ctx = new AudioContext();
// don't do this IRL
document.addEventListener("click", () => ctx.resume());

console.log("hi");
