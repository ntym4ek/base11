/**
 * @file
 * Всплывающая кнопка копирования текста в буфер обмена с доступными уведомлениями (Vanilla JS).
 */

((Drupal, once) => {
  'use strict';

  const copyText = Drupal.t('Copy to clipboard');
  const failText = Drupal.t('Failed to copy');
  const copiedText = Drupal.t('Copied');

  /**
   * Копирует текст в буфер обмена и обновляет визуальный тултип + живую область A11y.
   *
   * @param {string} text
   * @param {HTMLButtonElement} btn
   * @param {HTMLElement} tooltipText
   * @param {HTMLElement} liveRegion
   * @param {Object} state
   */
  async function copyToClipboard(text, btn, tooltipText, liveRegion, state) {
    if (state.resetTimer) {
      clearTimeout(state.resetTimer);
    }

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
      liveRegion.textContent = copiedText;
      btn.classList.add('click-to-copy-copied');

      state.resetTimer = setTimeout(() => {
        tooltipText.textContent = copyText;
        liveRegion.textContent = '';
        btn.classList.remove('click-to-copy-copied');
        state.resetTimer = null;
      }, 1500);
    } catch (err) {
      console.warn('Ошибка копирования в буфер обмена.', err);
      tooltipText.textContent = failText;
      liveRegion.textContent = failText;

      state.resetTimer = setTimeout(() => {
        tooltipText.textContent = copyText;
        liveRegion.textContent = '';
        state.resetTimer = null;
      }, 1500);
    }
  }

  /**
   * Инициализирует кнопку копирования рядом с элементом .click-to-copy.
   *
   * @param {HTMLElement} target
   */
  function initClickToCopy(target) {
    const tooltipDiv = document.createElement('div');
    tooltipDiv.classList.add('click-to-copy__tooltip');

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('click-to-copy__btn');
    button.setAttribute('aria-label', copyText);

    // Валидируем толщину линии SVG перед подстановкой в разметку
    const parsedStroke = Number.parseFloat(target.dataset.clipboardIconStrokeWidth);
    const strokeWidth = Number.isFinite(parsedStroke) && parsedStroke > 0 ? String(parsedStroke) : '1.5';

    // SVG-иконка копирования (Tabler Icons)
    button.innerHTML = `<svg class="click-to-copy__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>`;

    const tooltipText = document.createElement('span');
    tooltipText.classList.add('click-to-copy__tooltiptext');
    tooltipText.textContent = copyText;

    // Отдельная живая область (aria-live) не озвучивается при загрузке страницы,
    // а срабатывает только в момент фактического копирования
    const liveRegion = document.createElement('span');
    liveRegion.classList.add('visually-hidden');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('role', 'status');

    tooltipDiv.appendChild(button);
    tooltipDiv.appendChild(tooltipText);
    tooltipDiv.appendChild(liveRegion);

    if (target.parentNode) {
      target.parentNode.insertBefore(tooltipDiv, target.nextSibling);
    }

    const state = { resetTimer: null };

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const textToCopy = target.dataset.copyText || target.textContent.trim();
      copyToClipboard(textToCopy, button, tooltipText, liveRegion, state);
    });
  }

  /**
   * Drupal behavior для элементов .click-to-copy.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.clickToCopy = {
    attach(context) {
      once('click-to-copy-once', '.click-to-copy', context).forEach(initClickToCopy);
    },
  };
})(Drupal, once);
