class Pixi {

  constructor(element, renderOptions) {
    renderOptions.renderer = PIXI.autoDetectRenderer(renderOptions.width, renderOptions.height, renderOptions, renderOptions.transparent);
    renderOptions.renderer.backgroundColor = renderOptions.background || 0xFFFFFF;
    renderOptions.renderer.view.style.pos = 'absolute';
    renderOptions.renderer.view.style.top = '0px';
    renderOptions.renderer.view.style.left = '0px';
    renderOptions.canvas = renderOptions.renderer.view;

    element.appendChild(renderOptions.canvas);

    return renderOptions;
  }
}