/**
 * @file
 * Функционал переключения видимости вводимого пароля в полях type="password".
 */

((Drupal, once) => {
  const showText = Drupal.t('Show password');
  const hideText = Drupal.t('Hide password');

  const ICON_SHOW =
    '<svg class="password-toggle__icon password-toggle__icon--show" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />' +
    '<path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />' +
    '</svg>';

  const ICON_HIDE =
    '<svg class="password-toggle__icon password-toggle__icon--hide" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />' +
    '<path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />' +
    '<path d="M3 3l18 18" />' +
    '</svg>';

  /**
   * Инициализирует переключатель видимости пароля для input[type="password"].
   *
   * @param {HTMLInputElement} input
   *   Поле ввода пароля.
   */
  function initPasswordToggle(input) {
    if (input.dataset.noPasswordToggle !== undefined || input.closest('.password-toggle-wrapper')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'password-toggle-wrapper';

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-toggle-btn';
    button.setAttribute('aria-label', showText);
    button.setAttribute('title', showText);
    button.setAttribute('aria-pressed', 'false');
    button.tabIndex = -1;
    button.innerHTML = ICON_SHOW + ICON_HIDE;

    wrapper.appendChild(button);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      button.classList.toggle('is-revealed', isPassword);
      button.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      const currentLabel = isPassword ? hideText : showText;
      button.setAttribute('aria-label', currentLabel);
      button.setAttribute('title', currentLabel);

      input.focus();
    });

    if (input.form) {
      input.form.addEventListener('reset', () => {
        setTimeout(() => {
          input.type = 'password';
          button.classList.remove('is-revealed');
          button.setAttribute('aria-pressed', 'false');
          button.setAttribute('aria-label', showText);
          button.setAttribute('title', showText);
        }, 0);
      });
    }
  }

  /**
   * Drupal behavior для password toggle.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.base11PasswordToggle = {
    attach(context) {
      once('b11-password-toggle', 'input[type="password"]', context).forEach(initPasswordToggle);
    },
  };

})(Drupal, once);
