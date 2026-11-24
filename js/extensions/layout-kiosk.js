/**
 * @file
 * Скрипт живых часов и полноэкранного режима инфоэкранов (base11/layout-kiosk).
 *
 * Атрибуты:
 * - [data-b11-kiosk-clock]      — элемент вывода локального времени ЧЧ:ММ:СС
 * - [data-b11-kiosk-fullscreen] — кнопка переключения полноэкранного режима браузера
 */
((Drupal, once) => {
  'use strict';

  const clockTimers = new WeakMap();

  /**
   * Форматирует текущее время в виде ЧЧ:ММ:СС.
   *
   * @return {string}
   */
  function formatTime() {
    const now = new Date();
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  Drupal.behaviors.base11LayoutKiosk = {
    attach(context) {
      once('base11-kiosk-clock', '[data-b11-kiosk-clock]', context).forEach((clockEl) => {
        clockEl.textContent = formatTime();
        const timer = window.setInterval(() => {
          clockEl.textContent = formatTime();
        }, 1000);
        clockTimers.set(clockEl, timer);
      });

      once('base11-kiosk-fullscreen', '[data-b11-kiosk-fullscreen]', context).forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }
      context.querySelectorAll('[data-b11-kiosk-clock]').forEach((clockEl) => {
        const timer = clockTimers.get(clockEl);
        if (timer) {
          window.clearInterval(timer);
          clockTimers.delete(clockEl);
        }
      });
    },
  };
})(Drupal, once);
