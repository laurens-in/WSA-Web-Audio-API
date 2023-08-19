const ctx = new AudioContext();

const startButton = document.querySelector("#play-osc");
const stopButton = document.querySelector("#stop-osc");
const frequencySlider = document.querySelector("#frequency-osc");
const detuneSlider = document.querySelector("#detune-osc");

// we put this in a function to not pollute the global namespace, because we may want many controlls at some point
const setupControls = (start, stop, frequency, detune, ctx) => {
  let osc;
  start.addEventListener("click", () => {
    if (ctx.state !== "running") ctx.resume();
    if (osc) return;
    osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.start(ctx.currentTime);
  });
  stop.addEventListener("click", () => {
    if (osc) {
      osc.stop();
      osc = undefined;
    }
  });
  frequency.addEventListener("input", (e) => {
    if (osc) osc.frequency.setValueAtTime(e.target.value, ctx.currentTime);
  });
  detune.addEventListener("input", (e) => {
    if (osc) osc.detune.setValueAtTime(e.target.value, ctx.currentTime);
  });
};

setupControls(startButton, stopButton, frequencySlider, detuneSlider, ctx);
