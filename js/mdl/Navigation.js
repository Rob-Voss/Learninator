(function () {

  /**
   * Controller for sidebar navigation UI.
   * @param {!Element} el Wrapper element for navigation.
   * @param {!Element} btnEl Button element used to toggle navigation.
   * @constructor
   */
  var Navigation = function (el, btnEl) {
    /** @private {!Element} */
    this.el_ = el;

    /** @private {!Element} */
    this.btnEl_ = btnEl;

    // Style active links.
    [].slice.call(el.querySelectorAll('.nav-link')).forEach(function (link) {
      if (link.pathname === window.location.pathname) {
        link.className += ' active';
      }
    });

    // Feedback modal.
    this.feedbackBtnEl_.addEventListener(
      'click', this.startFeedback.bind(this)
    );

    // Events are bound to 'mousedown' and 'touchstart', rather than 'click'.
    // Mobile Safari disregards the event spec, and suppresses 'click' events on
    // non-interactive elements. We need clicks anywhere outside the sidebar to
    // *close* the sidebar, so the 'click' event isn't an option.
    // See: http://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
    //
    // Sidebar state changes:
    // - Button: toggle the sidebar.
    // - Document: Close the sidebar, if open.
    // - Sidebar: Stop bubbling, so sidebar does not close during navigation.
    this.btnEl_.addEventListener('mousedown', this.toggle.bind(this));
    this.btnEl_.addEventListener('touchstart', this.toggle.bind(this));
    var stopPropagation = function (e) {
      e.stopPropagation();
    };
    this.el_.addEventListener('mousedown', stopPropagation);
    this.el_.addEventListener('touchstart', stopPropagation);
    document.addEventListener('mousedown', this.close_.bind(this));
    document.addEventListener('touchstart', this.close_.bind(this));
  };

  /**
   * @return {boolean} Whether the sidebar UI is open.
   * @private
   */
  Navigation.prototype.isOpen_ = function () {
    return !!document.body.className.match(/\snav\-open/);
  };

  /**
   * Opens the sidebar UI.
   * @private
   */
  Navigation.prototype.open_ = function () {
    document.body.className += ' nav-open';
  };

  /**
   * Closes the sidebar UI.
   * @private
   */
  Navigation.prototype.close_ = function () {
    if (this.isOpen_()) {
      var body = document.body;
      body.className = body.className.replace(/\snav\-open/, '');
    }
  };

  /**
   * Shows/hides the sidebar UI.
   * @param {!Event} e
   */
  Navigation.prototype.toggle = function (e) {
    if (this.isOpen_()) {
      this.close_();
    } else {
      this.open_();
    }
    // These are redundant (preventing default is not theoretically necessary),
    // but mobile Safari disagrees.
    this.btnEl_.blur();
    e.preventDefault();
    e.stopPropagation();
  };

  /** Bootstrap */
  var el = document.querySelector('.sidebar-nav');
  var btnEl = document.querySelector('.header-nav-toggle');
  if (el && btnEl) {
    var nav = new Navigation(el, btnEl);
  }
}());
