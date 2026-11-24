/**
 * @file
 * Управление сегментированными переключателями панели фильтров (base11/filter-bar).
 *
 * Атрибуты:
 * - [data-b11-segmented]        — контейнер .b11-segmented для кнопочных переключателей
 * - [data-b11-segment-value]    — значение элемента при выборе
 */
((Drupal, once) => {
  'use strict';

  Drupal.behaviors.base11FilterBar = {
    attach(context) {
      once('base11-segmented', '[data-b11-segmented]', context).forEach((group) => {
        const name = group.getAttribute('data-b11-segmented') || '';
        const items = Array.from(group.querySelectorAll('.b11-segmented__item'));

        items.forEach((item) => {
          item.addEventListener('click', () => {
            // Ссылочные элементы выполняют штатный переход / AJAX; клиентское переключение для кнопок
            if (item.tagName === 'A' && !item.hasAttribute('data-b11-client-only')) {
              return;
            }

            items.forEach((el) => {
              const active = el === item;
              el.classList.toggle('is-active', active);
              el.setAttribute('aria-pressed', active ? 'true' : 'false');
            });

            const value = item.getAttribute('data-b11-segment-value') || item.textContent.trim();
            group.dispatchEvent(new CustomEvent('b11:filter-change', {
              bubbles: true,
              detail: { name, value, item },
            }));
          });
        });
      });
    },
  };
})(Drupal, once);
