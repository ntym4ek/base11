/**
 * @file
 * Индикатор отправки форм, навигационных кнопок-ссылок и защита от повторного нажатия (Vanilla JS для Drupal 11).
 */

((Drupal, once) => {
  'use strict';

  // Задержка перед показом спиннера на ссылках-кнопках (в мс), чтобы избежать мигания на быстрых переходах.
  const LINK_SPINNER_DELAY = 120;

  // Страховочный таймаут (в мс) на случай сбоя сети, скачивания файла или отмены перехода.
  const SAFETY_TIMEOUT = 15000;

  // Хранилище активных таймеров навигационных ссылок для корректной очистки при возврате из кэша.
  const activeLinkTimers = new Map();

  /**
   * Сброс состояния отправки на форме и её кнопках.
   *
   * @param {HTMLFormElement} form
   */
  const resetFormState = (form) => {
    delete form.dataset.submitting;
    form.querySelectorAll('.is-loading').forEach((btn) => {
      btn.classList.remove('is-loading');
    });
  };

  /**
   * Сброс состояния загрузки на навигационной кнопке-ссылке.
   *
   * @param {HTMLAnchorElement} link
   */
  const resetLinkState = (link) => {
    const timers = activeLinkTimers.get(link);
    if (timers) {
      clearTimeout(timers.delayId);
      clearTimeout(timers.safetyId);
      activeLinkTimers.delete(link);
    }
    delete link.dataset.navigating;
    link.classList.remove('is-loading');
  };

  /**
   * Сброс состояния всех активных кнопок-ссылок (например, при возврате кнопкой «Назад»).
   */
  const resetAllLinks = () => {
    activeLinkTimers.forEach((timers, link) => {
      clearTimeout(timers.delayId);
      clearTimeout(timers.safetyId);
      delete link.dataset.navigating;
      link.classList.remove('is-loading');
    });
    activeLinkTimers.clear();

    document.querySelectorAll('a.is-loading, a[data-navigating]').forEach((link) => {
      delete link.dataset.navigating;
      link.classList.remove('is-loading');
    });
  };

  /**
   * Проверяет, должен ли отображаться спиннер при клике по кнопке-ссылке.
   *
   * @param {HTMLAnchorElement} link
   * @param {MouseEvent} event
   * @return {boolean}
   */
  const shouldHandleLinkSpinner = (link, event) => {
    // Игнорируем отменённые клики, не левую кнопку мыши и клики с клавишами-модификаторами (новая вкладка/окно).
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return false;
    }

    // Пропускаем AJAX-триггеры, лайтбоксы, кнопки-ссылки, заблокированные элементы и явное отключение спиннера.
    if (
      link.classList.contains('use-ajax') ||
      link.classList.contains('no-spinner') ||
      link.classList.contains('button--link') ||
      link.classList.contains('glightbox') ||
      link.classList.contains('lightbox') ||
      link.classList.contains('disabled') ||
      link.classList.contains('is-disabled') ||
      link.dataset.drupalAjax !== undefined ||
      link.dataset.dialogType !== undefined ||
      link.hasAttribute('download') ||
      link.getAttribute('aria-disabled') === 'true'
    ) {
      return false;
    }

    // Пропускаем ссылки, открывающиеся в новом окне/фрейме.
    const target = link.getAttribute('target');
    if (target && target !== '_self') {
      return false;
    }

    // Пропускаем пустые, якорные и не-навигационные протоколы (tel:, mailto:, javascript:).
    const rawHref = (link.getAttribute('href') || '').trim();
    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      rawHref.startsWith('javascript:') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:')
    ) {
      return false;
    }

    // Пропускаем внутристраничные якорные переходы (тот же путь и параметры, отличается только #hash).
    try {
      const url = new URL(link.href, window.location.href);
      if (
        url.origin === window.location.origin &&
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return false;
      }
    } catch (err) {
      return false;
    }

    return true;
  };

  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Отслеживает отправку стандартных форм и переходы по навигационным кнопкам-ссылкам,
   *   отображая спиннер на нажатой кнопке.
   */
  Drupal.behaviors.formSubmitSpinner = {
    attach(context) {
      // 1. Обработка отправки стандартных HTML-форм
      once('form-submit-spinner', 'form', context).forEach((form) => {
        // Пропускаем формы с системным AJAX Drupal (там работает штатный Drupal.ajax)
        // и формы, открывающиеся в новой вкладке.
        if (form.classList.contains('use-ajax-submit') || form.target === '_blank') {
          return;
        }

        form.addEventListener('submit', (e) => {
          // Если отправка уже была прервана или обработана другим скриптом.
          if (e.defaultPrevented) {
            return;
          }

          // Проверяем нативную валидность формы (required, email, pattern и т.д.).
          if (form.checkValidity && !form.checkValidity()) {
            return;
          }

          // Определяем кнопку, вызвавшую отправку.
          const submitter = e.submitter || form.querySelector('button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled]), button:not([type]):not([disabled])');
          if (!submitter) {
            return;
          }

          // Пропускаем AJAX-кнопки Drupal, формы с открытием в новом окне и кнопки с явным отключением.
          if (
            submitter.classList.contains('use-ajax') ||
            submitter.dataset.drupalAjax ||
            submitter.getAttribute('formtarget') === '_blank' ||
            submitter.classList.contains('no-spinner')
          ) {
            return;
          }

          // Защита от повторного нажатия (Double Submit).
          if (form.dataset.submitting === 'true') {
            e.preventDefault();
            return;
          }
          form.dataset.submitting = 'true';

          // Включаем спиннер на кнопке.
          submitter.classList.add('is-loading');

          // Страховочный таймаут на случай сбоя сети или отмены запроса.
          setTimeout(() => {
            resetFormState(form);
          }, SAFETY_TIMEOUT);
        });
      });

      // 2. Делегированная обработка навигационных кнопок-ссылок (включая кнопки внутри модальных окон)
      once('link-button-spinner', 'html').forEach(() => {
        document.addEventListener('click', (e) => {
          const link = e.target.closest('a.button[href], a.btn[href]');
          if (!link || !shouldHandleLinkSpinner(link, e)) {
            return;
          }

          // Защита от повторного нажатия во время перехода.
          if (link.dataset.navigating === 'true') {
            e.preventDefault();
            return;
          }
          link.dataset.navigating = 'true';

          // Включаем спиннер с короткой задержкой, чтобы на мгновенных переходах не мигал текст кнопки.
          const delayId = setTimeout(() => {
            link.classList.add('is-loading');
          }, LINK_SPINNER_DELAY);

          // Страховочный таймаут на случай отмены перехода или скачивания файла.
          const safetyId = setTimeout(() => {
            resetLinkState(link);
          }, SAFETY_TIMEOUT);

          activeLinkTimers.set(link, { delayId, safetyId });
        });
      });
    },
  };

  // Сброс состояния форм и ссылок при возврате из кэша браузера (BFCache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      document.querySelectorAll('form').forEach(resetFormState);
      resetAllLinks();
    }
  });

})(Drupal, once);
