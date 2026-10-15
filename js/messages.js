/**
 * @file
 * Всплывающее и исчезающее сообщение (Vanilla JS для Drupal 11).
 */

((Drupal, drupalSettings, once) => {
  'use strict';

  function closeMessages() {
    const messages = document.querySelectorAll('[data-drupal-messages] .messages');
    messages.forEach((msg) => msg.classList.remove('visible'));

    setTimeout(() => {
      const container = document.querySelector('[data-drupal-messages]');
      if (container) {
        container.remove();
      }
    }, 500);
  }

  function setTimer(ms = 1000) {
    return setTimeout(() => {
      closeMessages();
    }, ms);
  }

  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   При появлении сообщения на странице показать его сверху страницы.
   *   Убрать его через 10 секунд или по нажатию на кнопку.
   *   При наведении курсора на сообщение, не закрывать сообщение автоматически
   *   и убрать через секунду, после смещения курсора за его пределы.
   */
  Drupal.behaviors.messages = {
    attach(context) {
      once('messages-once', '[data-drupal-messages] .messages', context).forEach(
        (element) => {
          let closeTimer = null;

          // Если в настройках передан параметр messages.position = "inline"
          // вывести сообщения внутри формы на странице вместо плавающего окна
          if (drupalSettings.messages !== undefined && drupalSettings.messages.position === 'inline') {
            element.classList.add('inline');
          } else {
            closeTimer = setTimer(10000);

            element.addEventListener('mouseenter', () => {
              clearTimeout(closeTimer);
            });

            element.addEventListener('mouseleave', () => {
              closeTimer = setTimer(1000);
            });

            setTimeout(() => {
              element.classList.add('visible');
            }, 500);
          }

          const closeBtn = element.querySelector('.close');
          if (closeBtn) {
            closeBtn.addEventListener('click', () => {
              closeMessages();
            });
          }
        }
      );
    },
  };

})(Drupal, drupalSettings, once);
