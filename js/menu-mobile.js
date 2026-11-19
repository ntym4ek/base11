/**
 * @file
 * Управление выдвижным мобильным меню и его доступностью (Vanilla JS для Drupal 11).
 */

((Drupal, once, drupalSettings) => {
  'use strict';

  /**
   * Возвращает порог ширины экрана, начиная с которого мобильная шторка скрыта.
   *
   * @return {number}
   */
  function getMenuHideWidth() {
    return parseInt(drupalSettings.theme?.page_offside_hide_width, 10) || 1024;
  }

  /**
   * Переводит кнопку-триггер, если она свёрстана не как <button>, в доступный режим клавиатуры.
   *
   * @param {HTMLElement} trigger
   */
  function ensureAccessibleTrigger(trigger) {
    if (trigger.tagName !== 'BUTTON') {
      if (!trigger.hasAttribute('role')) {
        trigger.setAttribute('role', 'button');
      }
      if (!trigger.hasAttribute('tabindex')) {
        trigger.setAttribute('tabindex', '0');
      }
    }
    if (!trigger.hasAttribute('aria-expanded')) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  /**
   * Синхронизирует aria-expanded триггеров и атрибут inert для контейнера шторки.
   *
   * @param {boolean} isOpen
   */
  function syncOffsideAccessibility(isOpen) {
    const isDesktop = window.innerWidth >= getMenuHideWidth();
    const offside = document.querySelector('.page-offside');

    document.querySelectorAll('.page-offside-label').forEach((btn) => {
      btn.setAttribute('aria-expanded', isOpen && !isDesktop ? 'true' : 'false');
    });

    if (offside) {
      offside.inert = isDesktop || !isOpen;
    }
  }

  /**
   * Поведения мобильного меню (открытие, свайпы, Escape, аккордеон подменю).
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.mobileMenu = {
    attach(context) {
      let lastTrigger = null;

      function showMobileNav(trigger = null) {
        if (trigger) {
          lastTrigger = trigger;
        }
        document.body.classList.add('page-offside-opened');
        syncOffsideAccessibility(true);

        // Переносим фокус внутрь шторки, если открытие вызвано с кнопки-триггера
        if (trigger) {
          const offside = document.querySelector('.page-offside');
          const firstFocusable = offside?.querySelector('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
          if (firstFocusable) {
            firstFocusable.focus();
          }
        }
      }

      function hideMobileNav({ restoreFocus = false } = {}) {
        const offside = document.querySelector('.page-offside');
        const focusInsideOffside = offside && offside.contains(document.activeElement);

        // Сначала возвращаем фокус на кнопку-триггер, затем включаем inert
        if ((restoreFocus || focusInsideOffside) && lastTrigger && document.body.contains(lastTrigger)) {
          lastTrigger.focus();
        } else if (focusInsideOffside) {
          const fallbackTrigger = document.querySelector('.page-offside-label');
          fallbackTrigger?.focus();
        }

        document.body.classList.remove('page-offside-opened');
        syncOffsideAccessibility(false);
      }

      function toggleMobileNav(trigger) {
        if (document.body.classList.contains('page-offside-opened')) {
          hideMobileNav({ restoreFocus: true });
        } else {
          showMobileNav(trigger);
        }
      }

      // 1. Инициализация кнопок-триггеров (включая подгружаемые через AJAX)
      once('page-offside-label-once', '.page-offside-label', context).forEach((btn) => {
        ensureAccessibleTrigger(btn);

        btn.addEventListener('click', (e) => {
          if (window.innerWidth < getMenuHideWidth()) {
            toggleMobileNav(btn);
            e.stopPropagation();
          }
        });

        // Поддержка Enter и Space для устаревшей разметки <div class="page-offside-label">
        if (btn.tagName !== 'BUTTON') {
          btn.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && window.innerWidth < getMenuHideWidth()) {
              e.preventDefault();
              toggleMobileNav(btn);
            }
          });
        }
      });

      // 2. Инициализация глобальных обработчиков шторки, Escape и свайп-жестов
      once('page-offside-once', '.page-wrapper', context).forEach(() => {
        syncOffsideAccessibility(document.body.classList.contains('page-offside-opened'));

        // Закрытие при клике по контентной области страницы вне шторки
        const pageArea = document.querySelector('.page');
        if (pageArea) {
          pageArea.addEventListener('click', (e) => {
            if (!e.target.closest('.page-offside-label') && document.body.classList.contains('page-offside-opened')) {
              hideMobileNav();
            }
          });
        }

        // Закрытие шторки клавишей Escape с возвратом фокуса на кнопку
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && document.body.classList.contains('page-offside-opened')) {
            e.preventDefault();
            hideMobileNav({ restoreFocus: true });
          }
        });

        // Обработка свайп-жестов (от swipe-events.js)
        document.addEventListener('swiped-right', (e) => {
          if (window.innerWidth >= getMenuHideWidth()) return;
          const isLeftMenu = document.body.classList.contains('page-offside-left') ||
            !document.body.classList.contains('page-offside-right');

          if (isLeftMenu) {
            const isProhibited = e.target.closest('.page-offside-disabled, .swiper, .swiper-container');
            if (!isProhibited && !document.body.classList.contains('page-offside-opened')) {
              showMobileNav();
            }
          } else if (document.body.classList.contains('page-offside-opened')) {
            hideMobileNav();
          }
        });

        document.addEventListener('swiped-left', (e) => {
          if (window.innerWidth >= getMenuHideWidth()) return;
          const isLeftMenu = document.body.classList.contains('page-offside-left') ||
            !document.body.classList.contains('page-offside-right');

          if (isLeftMenu) {
            if (document.body.classList.contains('page-offside-opened')) {
              hideMobileNav();
            }
          } else {
            const isProhibited = e.target.closest('.page-offside-disabled, .swiper, .swiper-container');
            if (!isProhibited && !document.body.classList.contains('page-offside-opened')) {
              showMobileNav();
            }
          }
        });

        // Закрытие шторки и обновление inert при переходе на ширину десктопа
        window.addEventListener('resize', () => {
          const isDesktop = window.innerWidth >= getMenuHideWidth();
          if (isDesktop && document.body.classList.contains('page-offside-opened')) {
            hideMobileNav();
          } else {
            syncOffsideAccessibility(document.body.classList.contains('page-offside-opened'));
          }
        }, { passive: true });
      });

      // 3. Раскрываемые подменю в мобильной шторке (аккордеон)
      once('menu-item--expanded-once', '.page-offside .menu-item--expanded', context).forEach((element) => {
        const link = element.querySelector(':scope > a');
        if (!link) return;

        link.setAttribute('aria-expanded', element.classList.contains('open') ? 'true' : 'false');

        link.addEventListener('click', (event) => {
          event.preventDefault();

          const isAlreadyOpen = element.classList.contains('open');

          // Закрываем соседние раскрытые пункты того же уровня
          const parentList = element.parentElement;
          if (parentList) {
            parentList.querySelectorAll(':scope > .menu-item--expanded.open').forEach((sibling) => {
              if (sibling !== element) {
                sibling.classList.remove('open');
                sibling.querySelector(':scope > a')?.setAttribute('aria-expanded', 'false');
              }
            });
          }

          if (isAlreadyOpen) {
            element.classList.remove('open');
            link.setAttribute('aria-expanded', 'false');
          } else {
            element.classList.add('open');
            link.setAttribute('aria-expanded', 'true');
          }
        });
      });
    },
  };
})(Drupal, once, drupalSettings);
