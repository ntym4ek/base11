/**
 * @file
 * Управление фильтрами (Vanilla JS для Drupal 11):
 * - Мобильная версия: отображение фильтров в виде кнопок с центрированным модальным окном.
 *   При выключенном AJAX добавляет кнопку отправки формы в модальное окно.
 *   Отображает количество выбранных пунктов (бейдж).
 * - Десктопная версия: сворачивание/разворачивание списков (аккордеон).
 */
((Drupal, once) => {
  'use strict';

  // Сохраняем селектор открытого фильтра между AJAX-ответами
  let activeMobileFilterSelector = null;

  // Определение десктопа (порог медиа-запроса)
  const isDesktop = () => window.matchMedia('(min-width: 1366px)').matches;

  /**
   * Плавное сворачивание/разворачивание элемента без jQuery
   */
  function slideToggle(element, duration = 200) {
    const isHidden = window.getComputedStyle(element).display === 'none';

    if (isHidden) {
      element.style.removeProperty('display');
      let display = window.getComputedStyle(element).display;
      if (display === 'none') display = 'block';
      element.style.display = display;

      const height = element.offsetHeight;
      element.style.overflow = 'hidden';
      element.style.height = '0';
      element.style.paddingTop = '0';
      element.style.paddingBottom = '0';
      element.offsetHeight; // force reflow

      element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
      element.style.height = `${height}px`;
      element.style.removeProperty('padding-top');
      element.style.removeProperty('padding-bottom');

      setTimeout(() => {
        element.style.removeProperty('height');
        element.style.removeProperty('transition');
        element.style.removeProperty('overflow');
      }, duration);
    } else {
      element.style.overflow = 'hidden';
      element.style.height = `${element.offsetHeight}px`;
      element.offsetHeight; // force reflow

      element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
      element.style.height = '0';
      element.style.paddingTop = '0';
      element.style.paddingBottom = '0';

      setTimeout(() => {
        element.style.display = 'none';
        element.style.removeProperty('height');
        element.style.removeProperty('padding-top');
        element.style.removeProperty('padding-bottom');
        element.style.removeProperty('transition');
        element.style.removeProperty('overflow');
      }, duration);
    }
  }

  /**
   * Управление темной подложкой.
   */
  function toggleBackdrop(show) {
    let backdrop = document.querySelector('.facet-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'facet-backdrop';
      document.body.appendChild(backdrop);
    }

    if (show && !isDesktop()) {
      backdrop.classList.add('is-visible');
    } else {
      backdrop.classList.remove('is-visible');
    }
  }

  /**
   * Обновляет бейджи с количеством выбранных пунктов в заголовках legend.
   */
  function updateFilterBadges(form) {
    form.querySelectorAll('fieldset').forEach((fieldset) => {
      const title = fieldset.querySelector('legend .facet__title');
      if (!title) return;

      // Считаем все отмеченные чекбоксы внутри данного fieldset
      const checkedCount = fieldset.querySelectorAll('.form-checkbox:checked').length;
      let badge = title.querySelector('.facet__badge');

      if (checkedCount > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'facet__badge';
          const icon = title.querySelector('i');
          if (icon) {
            title.insertBefore(badge, icon);
          } else {
            title.appendChild(badge);
          }
        }
        badge.textContent = checkedCount;
        fieldset.classList.add('has-selected');
      } else {
        if (badge) {
          badge.remove();
        }
        fieldset.classList.remove('has-selected');
      }
    });
  }

  Drupal.behaviors.facetExposedFilters = {
    attach(context) {
      // 1. Инициализация глобальной подложки (строго один раз на body)
      once('facet-backdrop-init', 'body', context).forEach(() => {
        let backdrop = document.querySelector('.facet-backdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'facet-backdrop';
          document.body.appendChild(backdrop);
        }

        backdrop.addEventListener('click', () => {
          document.querySelectorAll('.bef-exposed-form fieldset.open').forEach((fs) => {
            fs.classList.remove('open');
          });
          toggleBackdrop(false);
          activeMobileFilterSelector = null;
        });
      });

      // 2. Инициализация формы фильтров
      once('facet-exposed-form-init', '.bef-exposed-form', context).forEach((formElement) => {
        // Вставляем шапку с названием фильтра и крестиком в каждое модальное окно
        formElement.querySelectorAll('fieldset').forEach((fieldset) => {
          const wrapper = fieldset.querySelector('.fieldset-wrapper');

          // Если шапка ещё не была добавлена
          if (wrapper && !wrapper.querySelector('.facet-modal-header')) {
            const titleNode = fieldset.querySelector('legend .facet__title');
            let filterTitle = '';
            if (titleNode) {
              const titleClone = titleNode.cloneNode(true);
              titleClone.querySelectorAll('.facet__badge, i').forEach((el) => el.remove());
              filterTitle = titleClone.textContent.trim();
            }

            const header = document.createElement('div');
            header.className = 'facet-modal-header';
            header.innerHTML = `
              <div class="facet-modal-title">${filterTitle}</div>
              <button type="button" class="facet-modal-close" aria-label="${Drupal.t('Закрыть')}">&times;</button>
            `;
            wrapper.insertBefore(header, wrapper.firstChild);
          }
        });

        // Исключаем открытие мобильного бокового меню по свайпу на фильтрах
        formElement.querySelectorAll('.form--inline').forEach((inline) => {
          inline.classList.add('page-offside-disabled');
        });

        // Проверяем: работает ли форма через AJAX или авто-отправку BEF
        const isAjaxOrAuto = formElement.hasAttribute('data-bef-auto-submit') ||
          formElement.classList.contains('views-ajax-processed');

        // Если AJAX выключен — добавляем кнопку «Применить» в модальные окна fieldset
        if (!isAjaxOrAuto) {
          formElement.querySelectorAll('fieldset .fieldset-wrapper').forEach((wrapper) => {
            if (!wrapper.querySelector('.facet-modal-actions')) {
              const actions = document.createElement('div');
              actions.className = 'facet-modal-actions';
              actions.innerHTML = `
                <button type="button" class="button button--primary facet-apply-btn">
                  ${Drupal.t('Применить')}
                </button>
              `;
              wrapper.appendChild(actions);
            }
          });
        }

        // Актуализируем метки выбранных пунктов при начальной загрузке/AJAX
        updateFilterBadges(formElement);

        // Делегирование событий на форме
        formElement.addEventListener('click', (e) => {
          // Делегирование: закрытие по клику на крестик
          const closeBtn = e.target.closest('.facet-modal-close');
          if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            formElement.querySelectorAll('fieldset.open').forEach((fs) => fs.classList.remove('open'));
            toggleBackdrop(false);
            activeMobileFilterSelector = null;
            return;
          }

          // Делегирование: клик по кнопке «Применить» внутри модального окна (без AJAX)
          const applyBtn = e.target.closest('.facet-apply-btn');
          if (applyBtn) {
            e.preventDefault();
            toggleBackdrop(false);
            const submitBtn = formElement.querySelector('input[type="submit"].form-submit');
            if (submitBtn) {
              submitBtn.click();
            }
            return;
          }

          // Делегирование: предотвращение закрытия при кликах внутри выпавшего контента
          if (e.target.closest('.fieldset-wrapper')) {
            e.stopPropagation();
            return;
          }

          // Делегирование: клик по заголовку <legend>
          const legend = e.target.closest('fieldset legend');
          if (legend && formElement.contains(legend)) {
            const fieldset = legend.closest('fieldset');
            if (!fieldset) return;

            const wrapper = fieldset.querySelector('.fieldset-wrapper');
            const selectorId = fieldset.getAttribute('data-drupal-selector') || fieldset.id;

            if (isDesktop()) {
              // === ДЕСКТОП: классический аккордеон ===
              fieldset.classList.toggle('open');
              if (wrapper) {
                slideToggle(wrapper, 200);
              }
            } else {
              // === МОБИЛЬНЫЙ / ПЛАНШЕТ: Центрированное модальное окно ===
              e.preventDefault();
              e.stopPropagation();

              const isAlreadyOpen = fieldset.classList.contains('open');

              // Закрываем другие открытые фильтры
              formElement.querySelectorAll('fieldset.open').forEach((fs) => {
                if (fs !== fieldset) {
                  fs.classList.remove('open');
                }
              });

              if (isAlreadyOpen) {
                fieldset.classList.remove('open');
                toggleBackdrop(false);
                activeMobileFilterSelector = null;
              } else {
                fieldset.classList.add('open');
                toggleBackdrop(true);
                activeMobileFilterSelector = selectorId;
              }
            }
          }
        });

        // Обновление бейджа на лету при клике по чекбоксу
        formElement.addEventListener('change', (e) => {
          if (e.target.classList.contains('form-checkbox')) {
            updateFilterBadges(formElement);
          }
        });
      });

      // 3. Восстановление открытого окна после AJAX-ответа
      if (!isDesktop() && activeMobileFilterSelector) {
        const restored = document.querySelector(`[data-drupal-selector="${activeMobileFilterSelector}"]`);
        if (restored) {
          restored.classList.add('open');
          toggleBackdrop(true);
        } else {
          toggleBackdrop(false);
          activeMobileFilterSelector = null;
        }
      }
    },
  };
})(Drupal, once);
