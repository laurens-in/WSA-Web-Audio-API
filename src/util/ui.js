export const createNamedSlider = (
  name,
  id,
  cb,
  min = 0,
  max = 1,
  step = 1,
  initial = 0,
  height = 150
) => {
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
    const value =
      step < 1 ? e.target.valueAsNumber.toFixed(2) : e.target.valueAsNumber;
    inputNumber.value = value;
    cb(value);
  });

  inputNumber.addEventListener("change", (e) => {
    const value =
      step < 1 ? e.target.valueAsNumber.toFixed(2) : e.target.valueAsNumber;
    inputSlider.value = value;
    cb(value);
  });

  return template.content.firstElementChild;
};
