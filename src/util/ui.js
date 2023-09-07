/**
 *
 * @callback eventCallback
 * @param {number} [value]
 */

/**
 * @typedef {Object} SliderConfigObject - The config object containing special configurations
 * @property {number} [config.min=0] - min value of the slider
 * @property {number} [config.max=100] - max value of the slider
 * @property {number} [config.step=1] - step value of the slider
 * @property {number} [config.initial=0] - initial value of the slider
 * @property {number} [config.height=150] - height of the slider in pixels
 */

/**
 *
 * @param {string} name - The display name of the slider
 * @param {string} id - The unique ID of the slider
 * @param {eventCallback} callback - The eventListener callback
 * @param {SliderConfigObject} [config] - The config object containing special configurations
 * @returns {Element} - The slider element
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

/**
 *
 * @param {string} name - The display name of the pad
 * @param {string} id - The unique id of the pad
 * @param {eventCallback} callback - The eventListener callback
 * @param {number} [size] - The size of the pad in pixels
 * @returns {Element} - The pad element
 */

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

/**
 *
 * @param {string} name - Display name of the section
 * @param {"row"|"grid"} layout - The type of layout, "row" or "grid"
 * @returns {[Element, Element]} Returns the parent element and the content element
 */

export const createSection = (name, layout) => {
  const template = document.createElement("template");
  template.innerHTML = `<div class="section"><div class="section-name">${name}</div><div class="section-content-${layout}"></div></div>`;
  return [
    template.content.firstElementChild,
    template.content.firstElementChild.lastElementChild,
  ];
};

/**
 * The FmVoice config object.
 * @typedef {Object} FmVoiceConfig
 * @property {number} freq - The carriers freq.
 * @property {number} amp - The carriers gain.
 * @property {FmModConfig} modulator - The modulator.
 * @property {FmVoiceRefs} refs - Contains the references to the playing nodes.
 */

/**
 * The FmMod config object. 
 * @typedef {Object} FmModConfig
 * @property {number} index - The modulators freq ratio.
 * @property {number} depth - The modulators multiplier.
 */

/**
 * The FmVoice refs object, holds references to playing nodes.
 * @typedef {Object} FmVoiceRefs
 * @property {OscillatorNode} freq - The carrier OscillatorNode.
 * @property {GainNode} amp - The carrier GainNode.
 * @property {FmModRefs} modulator - The refs for the modulators nodes.
 * @property {GainNode} env - The envelopes GainNode.
 * @property {boolean} dirty - Dirty flag.
 */

/**
 * The FmMod refs object, holds refrences to playing nodes.
 * @typedef {Object} FmModRefs
 * @property {OscillatorNode} index - The modulator OscillatorNode.
 * @property {GainNode} depth - The modulator GainNode.
 */

/**
 * @param {FmVoiceConfig} voice - The FmVoice config options.
 * @param {string} id - The unique id of the section.
 * @param {AudioContext} ctx - The audio context.
 * @returns {Element} The sections root element.
 */

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
    { min: 100, max: 1500, initial: voice.freq, height }
  );
  const amp = createNamedSlider(
    "Carrier Amp.",
    `carrier-amp-${id}`,
    (v) => {
      voice.amp = v;
      if (voice.refs) voice.refs.amp.gain.setValueAtTime(v, ctx.currentTime);
    },
    { min: 0, max: 1, initial: voice.amp, step: 0.01, height }
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
    { min: 0.05, max: 2, initial: voice.modulator.index, step: 0.01, height }
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
    { min: 0, max: 1, initial: voice.modulator.depth / 500, step: 0.01, height }
  );

  [freq, amp, modIndex, modDepth].forEach((el) =>
    sectionContent.appendChild(el)
  );
  return sectionParent;
};

/**
 * The config for an envelope
 * @typedef {Object} EnvelopeConfig
 * @property {number} attack - the envelopes attack
 * @property {number} decay - the envelopes attack
 * @property {number} sustain - the envelopes attack
 * @property {number} release - the envelopes attack
 */

/**
 * Creates an envelope section with sliders for Attack, Decay, Sustain, Release
 * @param {EnvelopeConfig} envelope - The config of the envelope
 * @returns {Element} The sections root element.
 */

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

/**
 *
 * @param {GainNode} masterGain - The master gain node.
 * @param {AudioContext} ctx - The reference to the AudioContext.
 * @returns {Element} The sections root element.
 */

export const createMasterSection = (masterGain, ctx) => {
  const height = 100;
  const [sectionParent, sectionContent] = createSection("Master", "row");

  // const effect = createNamedSlider("Effect", "effect-slider");

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

/**
 * Config object for a pad.
 * @typedef {Object} PadConfig
 * @property {string} name - The pads display name.
 * @property {eventCallback} callback - The callback if the pad is pressed.
 */

/**
 * Create a section with drum pads.
 * @param {PadConfig[]} padConfigs
 * @returns {Element} The sections root element.
 */

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

/**
 * Config object for a slider.
 * @typedef {Object} SliderConfig
 * @property {string} name - The sliders display name.
 * @property {string} id - The sliders id.
 * @property {eventCallback} callback - The callback if the slider is moved.
 * @property {SliderConfigObject} config - The configuration object for the slider.
 */

/**
 * Create a section with named sliders.
 * @param {SliderConfig[]} sliderConfigs
 * @returns {Element} The sections root element.
 */

export const createSliderSection = (sliderConfigs, name = "Slider Section") => {
  const [sectionParent, sectionContent] = createSection(
    name ?? "Slider Section",
    "grid"
  );

  const sliders = sliderConfigs.map((config, i) =>
    createNamedSlider(config.name, config.id, config.callback, config.config)
  );

  sliders.forEach((el) => {
    sectionContent.appendChild(el);
  });

  return sectionParent;
};
