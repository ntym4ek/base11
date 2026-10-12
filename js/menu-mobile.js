/**
 * @file
 * Подключение слайдера мобильного меню
 */

(($, Drupal, once, drupalSettings) => {
  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   */
  Drupal.behaviors.mobileMenu = {
    attach(context) {

      // если < menuHide, то вывести боковое меню
      // повесить обработчик свайпа
      function showMobileNav() {
        $("body").data("page-offside-opened", true).addClass("page-offside-opened");
      }
      function hideMobileNav() {
        $("body").data("page-offside-opened", false).removeClass("page-offside-opened");
      }
      function toggleMobileNav() {
        if ($("body").data("page-offside-opened")) {
          hideMobileNav();
        } else {
          showMobileNav();
        }
      }

      once('page-offside-once', '.page-wrapper', context).forEach(
        (element) => {

          // ширина экрана (обычно lg), начиная с которой убираем мобильное меню
          const menuHideWidth = drupalSettings.theme?.page_offside_hide_width;
          if ($(window).width() < menuHideWidth) {
            // клик по иконке Меню
            $(".page-offside-label").on("click", (e) => {
              toggleMobileNav();
              e.stopPropagation();
            });

            $(".page-offside-left .page, .page-offside-left .page-offside-label").on("swiped-right", (e) => {
              // если свайп вправо на Свайпере или блоке с классом main-menu-disabled, то не показываем меню
              let is_prohibited = $(e.target).closest(".page-offside-disabled, .swiper-container").length > 0;
              if (!is_prohibited) {
                showMobileNav();
              }
            });
            $(".page-offside-right .page, .page-offside-right .page-offside-label").on("swiped-left", (e) => {
              // если свайп вправо на Свайпере, то не показываем меню
              let is_prohibited = $(e.target).closest(".page-offside-disabled, .swiper-container").length > 0;
              if (!is_prohibited) {
                showMobileNav();
              }
            });
            $(".page-offside-left .page, .page-offside-left .page-offside, .page-offside-left .page-offside-label").on("swiped-left", () => {
              hideMobileNav();
            });
            $(".page-offside-right .page, .page-offside-right .page-offside, .page-offside-right .page-offside-label").on("swiped-right", () => {
              hideMobileNav();
            });
            $(".page").on("click", () => {
              hideMobileNav();
            });
          }
      });

      // раскрываемый список в мобильном меню
      once('menu-item--expanded-once', '.page-offside .menu-item--expanded', context).forEach(
        (element) => {
          const $element = $(element);
          const $submenu = $element.children('.menu');

          $element.children('a').on('click', function(event) {
            event.preventDefault();

            const isOpen = $element.hasClass('open');

            // Закрываем только соседние пункты того же уровня (аккордеон)
            $element
              .siblings('.menu-item--expanded.open')
              .removeClass('open')
              .children('.menu')
              .slideUp(200);

            // Переключаем текущий пункт
            if (isOpen) {
              $element.removeClass('open');
              $submenu.slideUp(200);
            } else {
              $element.addClass('open');
              $submenu.slideDown(200);
            }
          });
        }
      );


    },
  };

})(jQuery, Drupal, once, drupalSettings);
