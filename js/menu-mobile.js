/**
 * @file
 * Подключение слайдера мобильного меню (Vanilla JS для Drupal 11).
 */

((Drupal, once, drupalSettings) => {
  'use strict';

  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   */
  Drupal.behaviors.mobileMenu = {
    attach(context) {
      function showMobileNav() {
        document.body.classList.add('page-offside-opened');
      }

      function hideMobileNav() {
        document.body.classList.remove('page-offside-opened');
      }

      function toggleMobileNav() {
        document.body.classList.toggle('page-offside-opened');
      }

      // 1. Инициализация управления мобильным меню (шторка и жесты)
      once('page-offside-once', '.page-wrapper', context).forEach(() => {
        const menuHideWidth = parseInt(drupalSettings.theme?.page_offside_hide_width, 10) || 1024;

        // Клик по иконке/кнопке Меню
        document.querySelectorAll('.page-offside-label').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            if (window.innerWidth < menuHideWidth) {
              toggleMobileNav();
              e.stopPropagation();
            }
          });
        });

        // Закрытие при клике по контентной области страницы вне шторки
        const pageArea = document.querySelector('.page');
        if (pageArea) {
          pageArea.addEventListener('click', () => {
            if (document.body.classList.contains('page-offside-opened')) {
              hideMobileNav();
            }
          });
        }

        // Обработка свайп-жестов (от swipe-events.js)
        document.addEventListener('swiped-right', (e) => {
          if (window.innerWidth >= menuHideWidth) return;
          const isLeftMenu = document.body.classList.contains('page-offside-left') ||
            !document.body.classList.contains('page-offside-right');

          if (isLeftMenu) {
            // Меню слева: свайп вправо открывает меню
            const isProhibited = e.target.closest('.page-offside-disabled, .swiper, .swiper-container');
            if (!isProhibited && !document.body.classList.contains('page-offside-opened')) {
              showMobileNav();
            }
          } else {
            // Меню справа: свайп вправо закрывает меню
            if (document.body.classList.contains('page-offside-opened')) {
              hideMobileNav();
            }
          }
        });

        document.addEventListener('swiped-left', (e) => {
          if (window.innerWidth >= menuHideWidth) return;
          const isLeftMenu = document.body.classList.contains('page-offside-left') ||
            !document.body.classList.contains('page-offside-right');

          if (isLeftMenu) {
            // Меню слева: свайп влево закрывает меню
            if (document.body.classList.contains('page-offside-opened')) {
              hideMobileNav();
            }
          } else {
            // Меню справа: свайп влево открывает меню
            const isProhibited = e.target.closest('.page-offside-disabled, .swiper, .swiper-container');
            if (!isProhibited && !document.body.classList.contains('page-offside-opened')) {
              showMobileNav();
            }
          }
        });

        // Закрытие шторки при увеличении ширины экрана
        window.addEventListener('resize', () => {
          if (window.innerWidth >= menuHideWidth && document.body.classList.contains('page-offside-opened')) {
            hideMobileNav();
          }
        }, { passive: true });
      });

      // 2. Раскрываемый список в мобильном меню (аккордеон подменю)
      once('menu-item--expanded-once', '.page-offside .menu-item--expanded', context).forEach(
        (element) => {
          const link = element.querySelector(':scope > a');
          if (!link) return;

          link.addEventListener('click', (event) => {
            event.preventDefault();

            const isAlreadyOpen = element.classList.contains('open');

            // Закрываем соседние пункты того же уровня (поведение аккордеона)
            const parentList = element.parentElement;
            if (parentList) {
              parentList.querySelectorAll(':scope > .menu-item--expanded.open').forEach((sibling) => {
                if (sibling !== element) {
                  sibling.classList.remove('open');
                }
              });
            }

            // Переключаем текущий пункт
            if (isAlreadyOpen) {
              element.classList.remove('open');
            } else {
              element.classList.add('open');
            }
          });
        }
      );
    },
  };

})(Drupal, once, drupalSettings);
