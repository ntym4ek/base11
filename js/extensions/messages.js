/**
 * @file
 * Всплывающее и исчезающее сообщение (Vanilla JS для Drupal 11).
 */

((Drupal, drupalSettings, once) => {
  'use strict';

  function closeMessage(msg) {
    if (!msg || !msg.parentNode) return;
    msg.classList.remove('visible');

    setTimeout(() => {
      msg.remove();
    }, 400);
  }

  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Управление поведением системных сообщений:
   *   - Внутри модальных окон (.ui-dialog) сообщения всегда отображаются inline.
   *   - На страницах сообщения всплывают в виде аккуратного Toast-уведомления.
   *   - Статусные сообщения закрываются через 5 сек (с паузой при ховере).
   *   - Предупреждения закрываются через 8 сек.
   *   - Ошибки остаются видимыми до клика по крестику или устранения ошибки.
   */
  Drupal.behaviors.messages = {
    attach(context) {
      once('messages-once', '[data-drupal-messages] .messages', context).forEach(
        (element) => {
          let closeTimer = null;

          // Внутри модального окна (.ui-dialog) или при явном параметре messages.position = "inline"
          // выводим сообщения статично внутри контента, а не поверх экрана
          const isModal = Boolean(element.closest('.ui-dialog'));
          const isExplicitInline = drupalSettings.messages !== undefined && drupalSettings.messages.position === 'inline';

          if (isModal || isExplicitInline) {
            element.classList.add('inline');
          } else {
            const isError = element.classList.contains('messages--error') || element.classList.contains('error');
            const isWarning = element.classList.contains('messages--warning') || element.classList.contains('warning');

            // Время показа в зависимости от типа:
            // - Ошибки: не закрываются автоматически
            // - Предупреждения: 8 секунд
            // - Статусные и прочие сообщения: 5 секунд
            let timeout = 0;
            if (isError) {
              timeout = 0;
            } else if (isWarning) {
              timeout = 8000;
            } else {
              timeout = 5000;
            }

            if (timeout > 0) {
              closeTimer = setTimeout(() => {
                closeMessage(element);
              }, timeout);

              element.addEventListener('mouseenter', () => {
                clearTimeout(closeTimer);
              });

              element.addEventListener('mouseleave', () => {
                closeTimer = setTimeout(() => {
                  closeMessage(element);
                }, 1500);
              });
            }

            setTimeout(() => {
              element.classList.add('visible');
            }, 50);
          }

          const closeBtn = element.querySelector('.close');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              if (closeTimer) {
                clearTimeout(closeTimer);
              }
              if (element.classList.contains('inline')) {
                element.style.transition = 'opacity 200ms ease, transform 200ms ease';
                element.style.opacity = '0';
                element.style.transform = 'translateY(-6px)';
                setTimeout(() => {
                  element.remove();
                }, 200);
              } else {
                closeMessage(element);
              }
            });
          }
        }
      );
    },
  };

})(Drupal, drupalSettings, once);
