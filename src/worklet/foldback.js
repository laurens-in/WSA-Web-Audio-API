class FoldbackDistortionProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "threshold",
        defaultValue: 0.5,
        minValue: 0,
        maxValue: 1,
      },
    ];
  }

  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const threshold = Math.abs(parameters.threshold[0]);
    for (let channel = 0; channel < input.length; ++channel) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; ++i)
        outputChannel[i] = foldback(inputChannel[i], threshold);
    }

    return true;
  }
}

const foldback = (input, threshold) => {
  const makeUp = 1 / threshold;
  if (input > threshold || input < threshold * -1) {
    input = (threshold - (Math.abs(input) % threshold)) * Math.sign(input);
  }
  return input * makeUp;
};

registerProcessor("foldback-distortion-processor", FoldbackDistortionProcessor);
