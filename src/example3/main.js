const ctx = new AudioContext();

const startButton = document.querySelector("#play");
const stopButton = document.querySelector("#stop");
const frequencyCarrier = document.querySelector("#frequency-carrier");
const frequencyModulator = document.querySelector("#frequency-modulator");
const amplitudeModulator = document.querySelector("#modulator-amp");

// we put this in a function to not pollute the global namespace, because we may want many controlls at some point
const setupControls = (
  start,
  stop,
  frequencyCarrier,
  frequencyModulator,
  amplitudeModulator,
  ctx
) => {
  let carrier;
  let modulator;
  let modulatorAmp;
  start.addEventListener("click", () => {
    if (ctx.state !== "running") ctx.resume();
    if (carrier) return;

    // create nodes
    carrier = ctx.createOscillator();
    modulator = ctx.createOscillator();
    modulatorAmp = ctx.createGain();

    modulator.connect(modulatorAmp);
    modulatorAmp.connect(carrier.detune);
    carrier.connect(ctx.destination);
    modulator.start(ctx.currentTime);
    carrier.start(ctx.currentTime);
  });
  stop.addEventListener("click", () => {
    if (carrier) {
      carrier.stop();
      modulator.stop();
      carrier = undefined;
      modulator = undefined;
      modulatorAmp = undefined;
    }
  });
  frequencyCarrier.addEventListener("input", (e) => {
    if (carrier)
      carrier.frequency.setValueAtTime(e.target.value, ctx.currentTime);
  });
  frequencyModulator.addEventListener("input", (e) => {
    if (modulator)
      modulator.frequency.setValueAtTime(e.target.value, ctx.currentTime);
  });
  amplitudeModulator.addEventListener("input", (e) => {
    if (modulatorAmp)
      modulatorAmp.gain.setValueAtTime(e.target.value, ctx.currentTime);
  });
};

setupControls(
  startButton,
  stopButton,
  frequencyCarrier,
  frequencyModulator,
  amplitudeModulator,
  ctx
);
