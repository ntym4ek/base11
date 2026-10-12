/**
 * @file
 * Всплывающее и исчезающее сообщение
 */

(($, Drupal, settings, once) => {

  function closeMessages() {
    $("[data-drupal-messages] .messages").removeClass("visible");
    setTimeout(() => {
      $("[data-drupal-messages]").remove();
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
          var closeTimer = null;
          // если в настройках передан параметр messages.position = "inline"
          // вывести сообщения внутри формы на странице вместо плавающего окна
          if (settings.messages !== undefined && settings.messages.position === 'inline') {
            $(element).addClass("inline");
          } else {
            closeTimer = setTimer(10000);
            $(element).mouseover(() => {
              clearTimeout(closeTimer);
            }).mouseleave(() => {
              closeTimer = setTimer(1000);
            });
            setTimeout(() => {
              $(element).addClass("visible");
            }, 500);
          }
          $(element).find(".close").on("click", () => {
            closeMessages();
          });
        }
      );
    },
  };

})(jQuery, Drupal, drupalSettings, once);
