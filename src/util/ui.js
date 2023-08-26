/**
 *
 * @callback changedCallback
 * @param {number} value
 */

/**
 *
 * @param {string} name - The display name of the slider
 * @param {string} id - The unique ID of the slider
 * @param {changedCallback} cb - The callback which is called whenever a value changes
 * @param {Object} [config] - The config object containing special configurations
 * @param {number} [config.min=0] - min value of the slider
 * @param {number} [config.max=100] - max value of the slider
 * @param {number} [config.step=1] - step value of the slider
 * @param {number} [config.initial=0] - initial value of the slider
 * @param {number} [config.height=150] - height of the slider in pixels
 * @returns
 */

export const createNamedSlider = (name, id, cb, config) => {
  const { min, max, step, initial, height } = {
    ...{ min: 0, max: 100, step: 1, initial: 0, height: 150 },
    ...config,
  };
  const template = document.createElement("template");
  template.innerHTML = `<div class="named-slider">
      <input
        id="${id}-slider"
        class="slider"
        type="range"
        orient="vertical"
        min="${min}"
        max="${max}"
        step="${step}"
        value="${initial ? initial : min}"
        style="height: ${height}px;"
      />
      <input
        id="${id}-number"
        class="slider-value"
        type="number"
        min="${min}"
        max="${max}"
        step="${step}"
        value="${step < 1 ? initial.toFixed(2) : initial}" />
      <label for="${id}">${name}</label>
    </div>`;

  const inputSlider = template.content.firstElementChild.querySelector(
    `#${id}-slider`
  );
  const inputNumber = template.content.firstElementChild.querySelector(
    `#${id}-number`
  );

  inputSlider.addEventListener("input", (e) => {
    const value = e.target.valueAsNumber;
    inputNumber.value = step < 1 ? value.toFixed(2) : value;
    cb(value);
  });

  inputNumber.addEventListener("change", (e) => {
    const value = e.target.valueAsNumber;
    inputSlider.value = step < 1 ? value.toFixed(2) : value;
    cb(value);
  });

  cb(initial);

  return template.content.firstElementChild;
};

// {
//   carrier: {
//     freq: 400,
//     amp: 1,
//   },
//   modulator: {
//     index: 1.75,
//     amp: 300,
//   },
// },

export const createFmVoice = (voice, id, ctx) => {
  const template = document.createElement("template");
  template.innerHTML = `<div class="section">`;

  const text = document.createElement("template");
  text.innerHTML = `<div class="section-name">Voice ${id}</div>`;

  const carrierFreq = createNamedSlider(
    "Carrier Freq.",
    `carrier-freq-${id}`,
    (v) => {
      voice.carrier.freq = v;
      if (voice.refs)
        voice.refs.oscillators[0].frequency.setValueAtTime(v, ctx.currentTime);
    },
    { min: 100, max: 1500, initial: 300 }
  );
  const carrierAmp = createNamedSlider(
    "Carrier Amp.",
    `carrier-amp-${id}`,
    (v) => {
      voice.carrier.amp = v;
    },
    { min: 0, max: 1, initial: 1, step: 0.01 }
  );
  const modulatorIndex = createNamedSlider(
    "Mod. Index",
    `mod-index-${id}`,
    (v) => {
      voice.modulator.index = v;
      if (voice.refs)
        voice.refs.oscillators[1].frequency.setValueAtTime(
          v * voice.carrier.freq,
          ctx.currentTime
        );
    },
    { min: 0.05, max: 3, initial: 1, step: 0.01 }
  );
  const modulatorAmp = createNamedSlider(
    "Mod. Depth.",
    `mod-amp-${id}`,
    (v) => (voice.modulator.depth = v * 500),
    { min: 0, max: 1, step: 0.01 }
  );

  [
    text.content.firstElementChild,
    carrierFreq,
    carrierAmp,
    modulatorIndex,
    modulatorAmp,
  ].forEach((el) => template.content.firstElementChild.appendChild(el));
  return template.content.firstElementChild;
};
