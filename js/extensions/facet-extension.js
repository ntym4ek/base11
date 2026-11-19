/**
 * @file
 * Управление фильтрами Views / Facets (Vanilla JS для Drupal 11):
 * - На мобильных (< 1366px): открывает группу фильтров в центрированном модальном диалоге,
 *   поддерживает закрытие по Escape, крестику и клику на фон, отображает бейдж счётчика.
 * - На десктопе (>= 1366px): сворачивает/разворачивает список в виде аккордеона.
 */
((Drupal, once) => {
  'use strict';

  // Идентификатор открытого мобильного фильтра между AJAX-обновлениями Views
  let activeMobileFilterSelector = null;

  // Элемент legend, с которого было открыто текущее модальное окно (для возврата фокуса)
  let lastActiveLegend = null;

  // Проверка десктопного порога ширины (соответствует $laptop в base11)
  const isDesktop = () => window.matchMedia('(min-width: 1366px)').matches;

  /**
   * Плавное сворачивание/разворачивание контейнера без jQuery.
   *
   * @param {HTMLElement} element
   * @param {number} duration
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
      element.offsetHeight; // принудительный reflow

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
      element.offsetHeight; // принудительный reflow

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
   * Управляет видимой подложкой модального фильтра.
   *
   * @param {boolean} show
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
   * Извлекает чистый текст заголовка фильтра без бейджа и иконок.
   *
   * @param {HTMLElement} fieldset
   * @return {string}
   */
  function getFilterTitle(fieldset) {
    const titleNode = fieldset.querySelector('legend .facet__title') || fieldset.querySelector('legend');
    if (!titleNode) return '';

    const titleClone = titleNode.cloneNode(true);
    titleClone.querySelectorAll('.facet__badge, i').forEach((el) => el.remove());
    return titleClone.textContent.trim();
  }

  /**
   * Синхронизирует ARIA-атрибуты диалога и кнопки legend при открытии/закрытии фильтра.
   *
   * @param {HTMLFieldSetElement} fieldset
   * @param {boolean} isOpen
   * @param {boolean} asModal
   */
  function syncFieldsetA11y(fieldset, isOpen, asModal = false) {
    const legend = fieldset.querySelector('legend');
    const wrapper = fieldset.querySelector('.fieldset-wrapper');

    if (legend) {
      legend.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    if (wrapper) {
      if (isOpen && asModal) {
        wrapper.setAttribute('role', 'dialog');
        wrapper.setAttribute('aria-modal', 'true');
        const label = getFilterTitle(fieldset);
        if (label) {
          wrapper.setAttribute('aria-label', label);
        }
      } else {
        wrapper.removeAttribute('role');
        wrapper.removeAttribute('aria-modal');
        wrapper.removeAttribute('aria-label');
      }
    }
  }

  /**
   * Закрывает все открытые мобильные модальные фильтры.
   *
   * @param {boolean} restoreFocus
   */
  function closeAllMobileModals(restoreFocus = false) {
    document.querySelectorAll('.bef-exposed-form fieldset.open').forEach((fs) => {
      fs.classList.remove('open');
      syncFieldsetA11y(fs, false, false);
    });
    toggleBackdrop(false);
    activeMobileFilterSelector = null;

    if (restoreFocus && lastActiveLegend && document.body.contains(lastActiveLegend)) {
      lastActiveLegend.focus();
      lastActiveLegend = null;
    }
  }

  /**
   * Обновляет бейджи количества выбранных чекбоксов в заголовках legend.
   *
   * @param {HTMLElement} form
   */
  function updateFilterBadges(form) {
    form.querySelectorAll('fieldset').forEach((fieldset) => {
      const title = fieldset.querySelector('legend .facet__title');
      if (!title) return;

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
        badge.textContent = String(checkedCount);
        fieldset.classList.add('has-selected');
      } else {
        badge?.remove();
        fieldset.classList.remove('has-selected');
      }
    });
  }

  Drupal.behaviors.facetExposedFilters = {
    attach(context) {
      // 1. Глобальная подложка и закрытие по Escape (однократно на body)
      once('facet-backdrop-init', 'body', context).forEach(() => {
        let backdrop = document.querySelector('.facet-backdrop');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'facet-backdrop';
          document.body.appendChild(backdrop);
        }

        backdrop.addEventListener('click', () => {
          closeAllMobileModals(true);
        });

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && !isDesktop() && document.querySelector('.bef-exposed-form fieldset.open')) {
            e.preventDefault();
            closeAllMobileModals(true);
          }
        });
      });

      // 2. Инициализация форм фильтров
      once('facet-exposed-form-init', '.bef-exposed-form', context).forEach((formElement) => {
        formElement.querySelectorAll('fieldset').forEach((fieldset) => {
          const wrapper = fieldset.querySelector('.fieldset-wrapper');
          const legend = fieldset.querySelector('legend');
          const filterTitle = getFilterTitle(fieldset);

          // Делаем legend доступным триггером для клавиатуры и скринридеров
          if (legend) {
            legend.setAttribute('role', 'button');
            legend.setAttribute('tabindex', '0');
            legend.setAttribute('aria-expanded', fieldset.classList.contains('open') ? 'true' : 'false');
          }

          // Создаём шапку модального окна безопасно через DOM API (защита от XSS через textContent)
          if (wrapper && !wrapper.querySelector('.facet-modal-header')) {
            const header = document.createElement('div');
            header.className = 'facet-modal-header';

            const titleEl = document.createElement('div');
            titleEl.className = 'facet-modal-title';
            titleEl.textContent = filterTitle;

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'facet-modal-close';
            closeBtn.setAttribute('aria-label', Drupal.t('Close'));
            closeBtn.textContent = '\u00d7';

            header.appendChild(titleEl);
            header.appendChild(closeBtn);
            wrapper.insertBefore(header, wrapper.firstChild);
          }
        });

        // Отключаем перехват свайпов боковым меню внутри горизонтальной ленты фильтров
        formElement.querySelectorAll('.form--inline').forEach((inline) => {
          inline.classList.add('page-offside-disabled');
        });

        // При выключенном AJAX добавляем кнопку «Применить» внутрь каждого модального окна
        const isAjaxOrAuto = formElement.hasAttribute('data-bef-auto-submit') ||
          formElement.classList.contains('views-ajax-processed');

        if (!isAjaxOrAuto) {
          formElement.querySelectorAll('fieldset .fieldset-wrapper').forEach((wrapper) => {
            if (!wrapper.querySelector('.facet-modal-actions')) {
              const actions = document.createElement('div');
              actions.className = 'facet-modal-actions';

              const applyBtn = document.createElement('button');
              applyBtn.type = 'button';
              applyBtn.className = 'button button--primary facet-apply-btn';
              applyBtn.textContent = Drupal.t('Apply');

              actions.appendChild(applyBtn);
              wrapper.appendChild(actions);
            }
          });
        }

        updateFilterBadges(formElement);

        // Вспомогательное переключение фильтра по клику или клавише Enter/Space на legend
        const toggleFieldset = (fieldset, triggerLegend, event) => {
          const wrapper = fieldset.querySelector('.fieldset-wrapper');
          const selectorId = fieldset.getAttribute('data-drupal-selector') || fieldset.id;

          if (isDesktop()) {
            const willOpen = !fieldset.classList.contains('open');
            fieldset.classList.toggle('open', willOpen);
            syncFieldsetA11y(fieldset, willOpen, false);
            if (wrapper) {
              slideToggle(wrapper, 200);
            }
          } else {
            event.preventDefault();
            event.stopPropagation();

            const isAlreadyOpen = fieldset.classList.contains('open');

            formElement.querySelectorAll('fieldset.open').forEach((fs) => {
              if (fs !== fieldset) {
                fs.classList.remove('open');
                syncFieldsetA11y(fs, false, false);
              }
            });

            if (isAlreadyOpen) {
              fieldset.classList.remove('open');
              syncFieldsetA11y(fieldset, false, false);
              toggleBackdrop(false);
              activeMobileFilterSelector = null;
              lastActiveLegend = null;
            } else {
              lastActiveLegend = triggerLegend;
              fieldset.classList.add('open');
              syncFieldsetA11y(fieldset, true, true);
              toggleBackdrop(true);
              activeMobileFilterSelector = selectorId;

              const focusTarget = wrapper?.querySelector('.facet-modal-close') ||
                wrapper?.querySelector('input, select, button');
              focusTarget?.focus();
            }
          }
        };

        // Делегирование кликов в форме
        formElement.addEventListener('click', (e) => {
          if (e.target.closest('.facet-modal-close')) {
            e.preventDefault();
            e.stopPropagation();
            closeAllMobileModals(true);
            return;
          }

          if (e.target.closest('.facet-apply-btn')) {
            e.preventDefault();
            toggleBackdrop(false);
            const submitBtn = formElement.querySelector('input[type="submit"].form-submit, button[type="submit"].form-submit');
            submitBtn?.click();
            return;
          }

          if (e.target.closest('.fieldset-wrapper')) {
            e.stopPropagation();
            return;
          }

          const legend = e.target.closest('fieldset legend');
          if (legend && formElement.contains(legend)) {
            const fieldset = legend.closest('fieldset');
            if (fieldset) {
              toggleFieldset(fieldset, legend, e);
            }
          }
        });

        // Управление legend с клавиатуры (Enter / Space)
        formElement.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;

          const legend = e.target.closest('fieldset legend');
          if (legend && formElement.contains(legend)) {
            e.preventDefault();
            const fieldset = legend.closest('fieldset');
            if (fieldset) {
              toggleFieldset(fieldset, legend, e);
            }
          }
        });

        // Обновление бейджей при изменении чекбоксов
        formElement.addEventListener('change', (e) => {
          if (e.target.classList.contains('form-checkbox')) {
            updateFilterBadges(formElement);
          }
        });
      });

      // 3. Восстановление открытого мобильного окна после AJAX-ответа Views
      if (!isDesktop() && activeMobileFilterSelector) {
        const restored = document.querySelector(`[data-drupal-selector="${activeMobileFilterSelector}"]`);
        if (restored) {
          restored.classList.add('open');
          syncFieldsetA11y(restored, true, true);
          toggleBackdrop(true);
        } else {
          closeAllMobileModals(false);
        }
      }
    },
  };
})(Drupal, once);
