/**
 *
 * @callback changedCallback
 * @param {number} value
 */

/**
 *
 * @param {string} name - The display name of the slider
 * @param {string} id - The unique ID of the slider
 * @param {changedCallback} callback - The callback which is called whenever a value changes
 * @param {Object} [config] - The config object containing special configurations
 * @param {number} [config.min=0] - min value of the slider
 * @param {number} [config.max=100] - max value of the slider
 * @param {number} [config.step=1] - step value of the slider
 * @param {number} [config.initial=0] - initial value of the slider
 * @param {number} [config.height=150] - height of the slider in pixels
 * @returns
 */

export const createNamedSlider = (name, id, callback, config) => {
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
    callback(value);
  });

  inputNumber.addEventListener("change", (e) => {
    const value = e.target.valueAsNumber;
    inputSlider.value = step < 1 ? value.toFixed(2) : value;
    callback(value);
  });

  callback(initial);

  return template.content.firstElementChild;
};

export const createNamedPad = (name, id, callback, size = 40) => {
  const template = document.createElement("template");
  template.innerHTML = `<div class="named-pad">
      <button id="${id}-button" style="width: ${size}px; height: ${size}px;" class="pad"></button>
      <label for="${id}">${name}</label>      
    </div>`;

  const padButton = template.content.firstElementChild.querySelector(
    `#${id}-button`
  );

  const togglePad = () => {
    if (!padButton.classList.contains("pressed")) {
      padButton.classList.toggle("pressed");
      setTimeout(() => {
        padButton.classList.toggle("pressed");
      }, 100);
    }
  };

  padButton.addEventListener("click", () => {
    callback();
    togglePad();
  });

  return template.content.firstElementChild;
};

export const createSection = (name, layout) => {
  const template = document.createElement("template");
  template.innerHTML = `<div class="section"><div class="section-name">${name}</div><div class="section-content-${layout}"></div></div>`;
  return [
    template.content.firstElementChild,
    template.content.firstElementChild.lastElementChild,
  ];
};

export const createFmVoiceSection = (voice, id, ctx) => {
  const height = 100;
  const [sectionParent, sectionContent] = createSection(`Voice ${id}`, "row");

  const freq = createNamedSlider(
    "Carrier Freq.",
    `carrier-freq-${id}`,
    (v) => {
      voice.freq = v;
      if (voice.refs)
        voice.refs.freq.frequency.setValueAtTime(v, ctx.currentTime);
    },
    { min: 100, max: 1500, initial: 300, height }
  );
  const amp = createNamedSlider(
    "Carrier Amp.",
    `carrier-amp-${id}`,
    (v) => {
      voice.amp = v;
      if (voice.refs) voice.refs.amp.gain.setValueAtTime(v, ctx.currentTime);
    },
    { min: 0, max: 1, initial: 1, step: 0.01, height }
  );
  const modIndex = createNamedSlider(
    "Mod. Index",
    `mod-index-${id}`,
    (v) => {
      voice.modulator.index = v;
      if (voice.refs)
        voice.refs.modulator.index.frequency.setValueAtTime(
          v * voice.freq,
          ctx.currentTime
        );
    },
    { min: 0.05, max: 2, initial: 0.5, step: 0.01, height }
  );
  const modDepth = createNamedSlider(
    "Mod. Depth.",
    `mod-amp-${id}`,
    (v) => {
      const depthMultiplied = v * 500;
      voice.modulator.depth = depthMultiplied;
      if (voice.refs)
        voice.refs.modulator.depth.gain.setValueAtTime(
          depthMultiplied,
          ctx.currentTime
        );
    },
    { min: 0, max: 1, step: 0.01, height }
  );

  [freq, amp, modIndex, modDepth].forEach((el) =>
    sectionContent.appendChild(el)
  );
  return sectionParent;
};

export const createEnvelopeSection = (envelope) => {
  const height = 100;
  const [sectionParent, sectionContent] = createSection("Envelope", "row");

  const attack = createNamedSlider(
    "Attack",
    "attack-slider",
    (v) => {
      envelope.attack = v;
    },
    { min: 0.01, max: 0.5, step: 0.01, initial: 0.05, height }
  );

  const decay = createNamedSlider(
    "Decay",
    "decay-slider",
    (v) => {
      envelope.decay = v;
    },
    { min: 0.01, max: 0.5, step: 0.01, initial: 0.05, height }
  );

  const sustain = createNamedSlider(
    "Sustain",
    "sustain-slider",
    (v) => {
      envelope.sustain = v;
    },
    { min: 0, max: 1, step: 0.01, initial: 0.75, height }
  );

  const release = createNamedSlider(
    "Release",
    "release-slider",
    (v) => {
      envelope.release = v;
    },
    { min: 0.01, max: 2, step: 0.01, initial: 0.5, height }
  );

  [attack, decay, sustain, release].forEach((el) => {
    sectionContent.appendChild(el);
  });

  return sectionParent;
};

export const createMasterSection = (masterGain, ctx) => {
  const height = 100;
  const [sectionParent, sectionContent] = createSection("Master", "row");

  const master = createNamedSlider(
    "Master",
    "master-slider",
    (v) => masterGain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.02),
    {
      min: 0,
      max: 1,
      step: 0.01,
      height,
    }
  );

  sectionContent.appendChild(master);

  return sectionParent;
};

export const createPadSection = (padConfigs) => {
  const [sectionParent, sectionContent] = createSection("Drum Pad", "grid");

  const pads = padConfigs.map((config, i) =>
    createNamedPad(config.name, `pad-button-${i}`, config.callback)
  );

  pads.forEach((el) => {
    sectionContent.appendChild(el);
  });

  const buttons = pads.map((el) => el.firstElementChild);

  return [sectionParent, buttons];
};
