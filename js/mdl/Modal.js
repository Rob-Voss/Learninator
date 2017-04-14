(function () {

  /**
   * Controller for a fullscreen overlay modal, and a button to trigger it.
   * @param {!Element} element Wrapper element for modal form.
   * @param {!Array<Element>} buttons One or more buttons, which should trigger
   *     the modal overlay when pressed.
   * @constructor
   */
  var ModalController = function (element, buttons) {
    this.element = element;
    this.form = element.querySelector('.address-wrapper');
    this.input = element.querySelector('.address-input');
    this.buttons = buttons;
    this.bindEvents();
  };

  /**
   * Binds event listeners after the modal is initialized.
   */
  ModalController.prototype.bindEvents = function () {
    // Clicking the background closes the form.
    this.element.addEventListener('click', this.close.bind(this));

    // ... except for clicks within the form.
    this.form.addEventListener('click', function (event) {
      event.stopPropagation();
    });

    // Escape should also close the form.
    this.input.addEventListener('keydown', function (event) {
      if ((event.which || event.keyCode) === 27) {
        this.close();
      }
    }.bind(this));

    // Clicking the button should open the form.
    this.buttons.forEach(function (button) {
      button.addEventListener('click', this.open.bind(this));
    }, this);
  };

  /**
   * Opens the modal.
   */
  ModalController.prototype.open = function () {
    document.body.className += ' has-modal';
    this.element.className = this.element.className.replace('hidden', '');
    this.input.focus();
  };

  /**
   * Closes the modal.
   */
  ModalController.prototype.close = function () {
    document.body.className = document.body.className.replace('has-modal', '');
    this.element.className += ' hidden';
    this.input.blur();
  };

  /* Bootstrap */

  var modal = document.querySelector('.modal');
  var buttons = document.querySelectorAll('.btn[data-target=modal]');
  if (modal && buttons.length) {
    buttons = [].slice.call(buttons);  // cast to array
    modal = new ModalController(modal, buttons);
  }
}());
