/**
 * @file
 * Всплывающая при наведении иконка для копирования строки в буфер обмена.
 */

((Drupal, once) => {
  const copyText = Drupal.t('Copy to clipboard');
  const failText = Drupal.t('Failed to copy');
  const copiedText = Drupal.t('Copied');

  /**
   * Копировать текст в буфер обмена.
   *
   * @param {string} text
   *   Текст для копирования.
   * @param {HTMLElement} btn
   *   Кнопка копирования.
   * @param {HTMLElement} tooltipText
   *   Элемент текста тултипа.
   */
  async function copyToClipboard(text, btn, tooltipText) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!successful) {
          throw new Error('execCommand returned false');
        }
      }

      tooltipText.textContent = copiedText;
      btn.classList.add('click-to-copy-copied');

      setTimeout(() => {
        tooltipText.textContent = copyText;
        btn.classList.remove('click-to-copy-copied');
      }, 1500);
    } catch (err) {
      console.warn('Copy to clipboard failed.', err);
      tooltipText.textContent = failText;

      setTimeout(() => {
        tooltipText.textContent = copyText;
      }, 1500);
    }
  }

  /**
   * Инициализировать элемент с классом click-to-copy.
   *
   * @param {HTMLElement} target
   *   Целевой элемент, текст которого копируется.
   */
  function initClickToCopy(target) {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.classList.add('click-to-copy__tooltip');

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('click-to-copy__btn');
    button.setAttribute('aria-label', copyText);

    const strokeWidth = target.dataset.clipboardIconStrokeWidth || '1.5';

    // SVG icon - https://tablericons.com/
    button.innerHTML = `<svg class="click-to-copy__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>`;

    const tooltipText = document.createElement('span');
    tooltipText.classList.add('click-to-copy__tooltiptext');
    tooltipText.setAttribute('role', 'status');
    tooltipText.textContent = copyText;

    tooltipDiv.appendChild(button);
    tooltipDiv.appendChild(tooltipText);

    // Вставляем тултип сразу после целевого элемента
    if (target.parentNode) {
      target.parentNode.insertBefore(tooltipDiv, target.nextSibling);
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const textToCopy = target.dataset.copyText || target.textContent.trim();
      copyToClipboard(textToCopy, button, tooltipText);
    });
  }

  /**
   * Drupal behavior для click-to-copy.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Инициализация кнопки копирования в буфер обмена для элементов .click-to-copy.
   */
  Drupal.behaviors.clickToCopy = {
    attach(context) {
      once('click-to-copy-once', '.click-to-copy', context).forEach(initClickToCopy);
    },
  };

})(Drupal, once);
