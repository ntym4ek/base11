/**
 * @file
 * Скрипт переключения закладок с поддержкой equal-height и WAI-ARIA Tabs (Vanilla JS).
 */

((Drupal, once) => {
  'use strict';

  // Счётчик блоков закладок на странице для гарантированно уникальных DOM ID
  let tabsGroupCounter = 0;

  /**
   * Выравнивает минимальную высоту всех панелей вкладок по самой высокой.
   *
   * @param {HTMLElement} container
   */
  function applyEqualHeight(container) {
    const contents = container.querySelectorAll('.tabs-js__content');
    if (!contents.length) return;

    let maxHeight = 0;

    contents.forEach((tab) => {
      tab.style.minHeight = '';

      if (tab.classList.contains('tabs-js__content--visible')) {
        maxHeight = Math.max(maxHeight, tab.offsetHeight);
      } else {
        // Временно делаем скрытую панель измеряемой без визуального мигания
        const prevCss = {
          position: tab.style.position,
          visibility: tab.style.visibility,
          display: tab.style.display,
        };

        tab.style.position = 'absolute';
        tab.style.visibility = 'hidden';
        tab.style.display = 'block';

        maxHeight = Math.max(maxHeight, tab.offsetHeight);

        tab.style.position = prevCss.position;
        tab.style.visibility = prevCss.visibility;
        tab.style.display = prevCss.display;
      }
    });

    if (maxHeight > 0) {
      contents.forEach((tab) => {
        tab.style.minHeight = `${maxHeight}px`;
      });
    }
  }

  /**
   * Находит целевую панель по идентификатору data-id внутри блока вкладок.
   *
   * @param {HTMLElement} tabsBlock
   * @param {string} targetId
   * @return {HTMLElement|null}
   */
  function findTabPanel(tabsBlock, targetId) {
    return tabsBlock.querySelector(`.tabs-js__content[data-id="${targetId}"]`) ||
      tabsBlock.querySelector(`[data-id="${targetId}"]`);
  }

  /**
   * Drupal behavior интерактивных закладок .tabs-js.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.tabsJs = {
    attach(context) {
      once('tabs-js-once', '.tabs-js', context).forEach((tabsBlock) => {
        const isEqualHeight = tabsBlock.classList.contains('tabs-js--equal-height') ||
          tabsBlock.classList.contains('tabs_js--equal-height');

        const nav = tabsBlock.querySelector('.tabs-js__nav');
        const links = Array.from(tabsBlock.querySelectorAll('.tabs-js__link'));
        const contents = Array.from(tabsBlock.querySelectorAll('.tabs-js__content'));

        if (!links.length || !contents.length) return;

        const groupPrefix = tabsBlock.id || `tabs-js-${++tabsGroupCounter}`;

        // 1. Настройка ролей WAI-ARIA и уникальных связей id / aria-controls / aria-labelledby
        if (nav) {
          nav.setAttribute('role', 'tablist');
        }

        let activeIndex = links.findIndex((link) => link.classList.contains('tabs-js__link--active'));
        if (activeIndex === -1) {
          activeIndex = 0;
        }

        links.forEach((link, index) => {
          const rawTargetId = link.dataset.targetId || String(index + 1);
          const panel = findTabPanel(tabsBlock, rawTargetId);
          const isActive = link.classList.contains('tabs-js__link--active');

          if (!link.id) {
            link.id = `${groupPrefix}-tab-${rawTargetId}`;
          }
          link.setAttribute('role', 'tab');
          link.setAttribute('aria-selected', isActive ? 'true' : 'false');
          // Паттерн roving tabindex: в порядок Tab входит только активная вкладка
          link.setAttribute('tabindex', index === activeIndex ? '0' : '-1');

          if (panel) {
            if (!panel.id) {
              panel.id = `${groupPrefix}-panel-${rawTargetId}`;
            }
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', link.id);
            panel.setAttribute('tabindex', '0');
            link.setAttribute('aria-controls', panel.id);
          }
        });

        // 2. Выравнивание высоты и отслеживание ресайза через requestAnimationFrame
        if (isEqualHeight) {
          applyEqualHeight(tabsBlock);

          let rafId = 0;
          const resizeObserver = new ResizeObserver(() => {
            if (rafId) {
              cancelAnimationFrame(rafId);
            }
            rafId = requestAnimationFrame(() => {
              rafId = 0;
              applyEqualHeight(tabsBlock);
            });
          });
          resizeObserver.observe(tabsBlock);
        }

        // 3. Делегированный переключатель вкладок по клику
        tabsBlock.addEventListener('click', (event) => {
          const tabLink = event.target.closest('.tabs-js__link');
          if (!tabLink || !tabsBlock.contains(tabLink)) return;

          event.preventDefault();

          if (tabLink.classList.contains('tabs-js__link--active')) return;

          const targetContent = findTabPanel(tabsBlock, tabLink.dataset.targetId);
          if (!targetContent) return;

          links.forEach((link) => {
            link.classList.remove('tabs-js__link--active');
            link.setAttribute('aria-selected', 'false');
            link.setAttribute('tabindex', '-1');
          });
          contents.forEach((tab) => {
            tab.classList.remove('tabs-js__content--visible');
          });

          tabLink.classList.add('tabs-js__link--active');
          tabLink.setAttribute('aria-selected', 'true');
          tabLink.setAttribute('tabindex', '0');
          targetContent.classList.add('tabs-js__content--visible');

          // Уведомляем вложенные слайдеры (например, Swiper) о смене видимых размеров
          window.dispatchEvent(new Event('resize'));
        });

        // 4. Клавиатурная навигация WAI-ARIA (стрелки, Home, End, Enter/Space)
        tabsBlock.addEventListener('keydown', (event) => {
          const activeLink = event.target.closest('.tabs-js__link');
          if (!activeLink) return;

          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            activeLink.click();
            return;
          }

          const currentIndex = links.indexOf(activeLink);
          let newIndex = null;

          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            newIndex = (currentIndex + 1) % links.length;
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            newIndex = (currentIndex - 1 + links.length) % links.length;
          } else if (event.key === 'Home') {
            newIndex = 0;
          } else if (event.key === 'End') {
            newIndex = links.length - 1;
          }

          if (newIndex !== null) {
            event.preventDefault();
            links[newIndex].focus();
            links[newIndex].click();
          }
        });
      });
    },
  };
})(Drupal, once);
