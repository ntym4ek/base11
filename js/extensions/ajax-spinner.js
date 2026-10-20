/**
 * @file
 * Индикатор отправки форм и защита от повторного нажатия (Vanilla JS для Drupal 11).
 */

((Drupal, once) => {
  'use strict';

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
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Отслеживает отправку стандартных форм и отображает спиннер на кнопке сабмита.
   */
  Drupal.behaviors.formSubmitSpinner = {
    attach(context) {
      once('form-submit-spinner', 'form', context).forEach((form) => {
        // Пропускаем формы с системным AJAX Drupal (там работает штатный Drupal.ajax)
        // и формы, открывающиеся в новой вкладке
        if (form.classList.contains('use-ajax-submit') || form.target === '_blank') {
          return;
        }

        form.addEventListener('submit', (e) => {
          // Если отправка уже была прервана или обработана другим скриптом
          if (e.defaultPrevented) {
            return;
          }

          // Проверяем нативную валидность формы (required, email, pattern и т.д.)
          if (form.checkValidity && !form.checkValidity()) {
            return;
          }

          // Определяем кнопку, вызвавшую отправку
          const submitter = e.submitter || form.querySelector('button[type="submit"]:not([disabled]), input[type="submit"]:not([disabled]), button:not([type]):not([disabled])');
          if (!submitter) {
            return;
          }

          // Пропускаем AJAX-кнопки Drupal, формы с открытием в новом окне и кнопки с явным отключением
          if (
            submitter.classList.contains('use-ajax') ||
            submitter.dataset.drupalAjax ||
            submitter.getAttribute('formtarget') === '_blank' ||
            submitter.classList.contains('no-spinner')
          ) {
            return;
          }

          // Защита от повторного нажатия (Double Submit)
          if (form.dataset.submitting === 'true') {
            e.preventDefault();
            return;
          }
          form.dataset.submitting = 'true';

          // Включаем спиннер на кнопке
          submitter.classList.add('is-loading');

          // Страховочный таймаут (15 сек) на случай сбоя сети или отмены запроса
          setTimeout(() => {
            resetFormState(form);
          }, 15000);
        });
      });
    },
  };

  // Сброс состояния при навигации назад/вперёд из кэша браузера (BFCache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      document.querySelectorAll('form').forEach(resetFormState);
    }
  });

})(Drupal, once);
