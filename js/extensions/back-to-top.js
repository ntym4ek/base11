/**
 * @file
 * Кнопка возврата к началу страницы с учётом A11y и prefers-reduced-motion (Vanilla JS).
 */

((Drupal, once) => {
  'use strict';

  const SCROLL_THRESHOLD = 400;

  /**
   * Управление отображением и кликом по кнопке возврата к началу страницы.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.backToTop = {
    attach(context) {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      once('back-to-top-once', '[data-drupal-selector="back-to-top"]', context).forEach((element) => {
        const isNativeButton = element.tagName === 'BUTTON';

        // Обеспечиваем клавиатурную роль для устаревшей разметки <div id="back-to-top">
        if (!isNativeButton && !element.hasAttribute('role')) {
          element.setAttribute('role', 'button');
        }

        const updateVisibility = () => {
          const isVisible = window.scrollY > SCROLL_THRESHOLD;
          element.classList.toggle('is-visible', isVisible);
          element.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

          if (isVisible) {
            if (isNativeButton) {
              element.removeAttribute('tabindex');
            } else {
              element.setAttribute('tabindex', '0');
            }
          } else {
            element.setAttribute('tabindex', '-1');
          }
        };

        const scrollToTop = () => {
          window.scrollTo({
            top: 0,
            behavior: reducedMotionQuery.matches ? 'auto' : 'smooth',
          });
        };

        // Первичная синхронизация (актуально при загрузке/обновлении в середине страницы)
        updateVisibility();

        // Троттлинг прокрутки через requestAnimationFrame
        let rafPending = false;
        window.addEventListener('scroll', () => {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            updateVisibility();
          });
        }, { passive: true });

        element.addEventListener('click', (e) => {
          e.preventDefault();
          scrollToTop();
        });

        if (!isNativeButton) {
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              scrollToTop();
            }
          });
        }
      });
    },
  };
})(Drupal, once);
