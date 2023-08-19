const ctx = new AudioContext();

const playOsc = () => {
  const osc = ctx.createOscillator();
  osc.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
};

const button = document.querySelector("#play-osc");

button.addEventListener("click", () => {
  if (ctx.state !== "running") ctx.resume();
  playOsc();
});
