/**
 * @file
 * Скрипт переключения закладок с поддержкой equal-height и a11y.
 */

((Drupal, once) => {

  /**
   * Выравнивает высоту контейнера/вкладок по самому высокому элементу.
   */
  function applyEqualHeight(container) {
    const contents = container.querySelectorAll('.tabs-js__content');
    if (!contents.length) return;

    let maxHeight = 0;

    contents.forEach((tab) => {
      // Сбрасываем ранее вычисленный min-height перед замером
      tab.style.minHeight = '';

      if (tab.classList.contains('tabs-js__content--visible')) {
        maxHeight = Math.max(maxHeight, tab.offsetHeight);
      } else {
        // Временно делаем невидимым, но измеряемым
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

  Drupal.behaviors.tabsJs = {
    attach(context) {
      once('tabs-js-once', '.tabs-js', context).forEach((tabsBlock) => {
        const isEqualHeight = tabsBlock.classList.contains('tabs-js--equal-height') ||
          tabsBlock.classList.contains('tabs_js--equal-height');

        const links = tabsBlock.querySelectorAll('.tabs-js__link');
        const contents = tabsBlock.querySelectorAll('.tabs-js__content');

        if (!links.length || !contents.length) return;

        // Инициализация ARIA-атрибутов
        links.forEach((link) => {
          const id = link.dataset.targetId;
          const target = tabsBlock.querySelector(`[data-id="${id}"]`);

          link.setAttribute('role', 'tab');
          link.setAttribute('tabindex', '0');

          if (target) {
            target.setAttribute('role', 'tabpanel');
            link.setAttribute('aria-controls', id);
          }

          const isActive = link.classList.contains('tabs-js__link--active');
          link.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        // Первичный расчет высоты
        if (isEqualHeight) {
          applyEqualHeight(tabsBlock);

          // Пересчет при изменении размеров экрана или загрузке контента/картинок
          const resizeObserver = new ResizeObserver(() => {
            applyEqualHeight(tabsBlock);
          });
          resizeObserver.observe(tabsBlock);
        }

        // Делегирование кликов по табам
        tabsBlock.addEventListener('click', (event) => {
          const tabLink = event.target.closest('.tabs-js__link');
          if (!tabLink || !tabsBlock.contains(tabLink)) return;

          event.preventDefault();

          if (tabLink.classList.contains('tabs-js__link--active')) return;

          const targetId = tabLink.dataset.targetId;
          const targetContent = tabsBlock.querySelector(`[data-id="${targetId}"]`);
          if (!targetContent) return;

          // Смена активных классов и атрибутов
          links.forEach((link) => {
            link.classList.remove('tabs-js__link--active');
            link.setAttribute('aria-selected', 'false');
          });
          contents.forEach((tab) => {
            tab.classList.remove('tabs-js__content--visible');
          });

          tabLink.classList.add('tabs-js__link--active');
          tabLink.setAttribute('aria-selected', 'true');
          targetContent.classList.add('tabs-js__content--visible');

          // Триггер пользовательского события для вложенных компонентов (например, Swiper/Sliders)
          window.dispatchEvent(new Event('resize'));
        });

        // Навигация стрелками на клавиатуре
        tabsBlock.addEventListener('keydown', (event) => {
          const activeLink = event.target.closest('.tabs-js__link');
          if (!activeLink) return;

          const linkArray = Array.from(links);
          const currentIndex = linkArray.indexOf(activeLink);
          let newIndex = null;

          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            newIndex = (currentIndex + 1) % linkArray.length;
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            newIndex = (currentIndex - 1 + linkArray.length) % linkArray.length;
          }

          if (newIndex !== null) {
            event.preventDefault();
            linkArray[newIndex].focus();
            linkArray[newIndex].click();
          }
        });
      });
    },
  };

})(Drupal, once);
