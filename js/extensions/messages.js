/**
 * @file
 * Всплывающие и встроенные системные сообщения с паузой при наведении и фокусе (Vanilla JS).
 */

((Drupal, drupalSettings, once) => {
  'use strict';

  /**
   * Плавно скрывает и удаляет сообщение из DOM.
   *
   * @param {HTMLElement} msg
   */
  function closeMessage(msg) {
    if (!msg || !msg.parentNode) return;
    msg.classList.remove('visible');

    setTimeout(() => {
      msg.remove();
    }, 400);
  }

  /**
   * Управление отображением и автозакрытием системных сообщений.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.messages = {
    attach(context) {
      once('messages-once', '[data-drupal-messages] .messages', context).forEach((element) => {
        let closeTimer = null;

        // Внутри модальных окон (.ui-dialog) или при messages.position = 'inline' выводятся статично
        const isModal = Boolean(element.closest('.ui-dialog'));
        const isExplicitInline = drupalSettings.messages !== undefined && drupalSettings.messages.position === 'inline';

        if (isModal || isExplicitInline) {
          element.classList.add('inline');
        } else {
          const isError = element.classList.contains('messages--error') || element.classList.contains('error');
          const isWarning = element.classList.contains('messages--warning') || element.classList.contains('warning');

          // Ошибки не закрываются автоматически; предупреждения — 8 сек; статусные — 5 сек
          let timeout = 0;
          if (isError) {
            timeout = 0;
          } else if (isWarning) {
            timeout = 8000;
          } else {
            timeout = 5000;
          }

          if (timeout > 0) {
            const scheduleClose = (delay) => {
              clearTimeout(closeTimer);
              closeTimer = setTimeout(() => {
                closeMessage(element);
              }, delay);
            };

            const pauseClose = () => {
              clearTimeout(closeTimer);
            };

            const resumeClose = () => {
              if (!element.matches(':hover') && !element.contains(document.activeElement)) {
                scheduleClose(1500);
              }
            };

            scheduleClose(timeout);

            // Пауза при наведении мыши и при клавиатурном фокусе внутри сообщения (WCAG 2.2.1)
            element.addEventListener('mouseenter', pauseClose);
            element.addEventListener('mouseleave', resumeClose);
            element.addEventListener('focusin', pauseClose);
            element.addEventListener('focusout', () => {
              setTimeout(resumeClose, 0);
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
      });
    },
  };
})(Drupal, drupalSettings, once);
