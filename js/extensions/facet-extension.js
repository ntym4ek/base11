/**
 * @file
 * Управление фильтрами:
 * - Мобильная версия: отображение фильтров в виде кнопок с центрированным модальным окном.
 *   При выключенном AJAX добавляет кнопку отправки формы в модальное окно.
 *   Отображает количество выбранных пунктов (бейдж).
 * - Десктопная версия: сворачивание/разворачивание списков (аккордеон).
 */
(function ($, Drupal, once) {
  'use strict';

  // Сохраняем селектор открытого фильтра между AJAX-ответами
  let activeMobileFilterSelector = null;

  // Определение десктопа (порог медиа-запроса)
  const isDesktop = () => window.matchMedia('(min-width: 1366px)').matches;

  /**
   * Управление темной подложкой.
   */
  function toggleBackdrop(show) {
    let $backdrop = $('.facet-backdrop');
    if (!$backdrop.length) {
      $backdrop = $('<div class="facet-backdrop"></div>').appendTo('body');
    }

    if (show && !isDesktop()) {
      $backdrop.addClass('is-visible');
    } else {
      $backdrop.removeClass('is-visible');
    }
  }

  /**
   * Обновляет бейджи с количеством выбранных пунктов в заголовках legend.
   */
  function updateFilterBadges($form) {
    $form.find('fieldset').each(function () {
      const $fieldset = $(this);
      const $title = $fieldset.find('legend .facet__title');
      if (!$title.length) return;

      // Считаем все отмеченные чекбоксы внутри данного fieldset
      const checkedCount = $fieldset.find('.form-checkbox:checked').length;
      let $badge = $title.find('.facet__badge');

      if (checkedCount > 0) {
        if (!$badge.length) {
          $badge = $('<span class="facet__badge"></span>');
          // Вставляем бейдж перед иконкой стрелки или в конец блока заголовка
          const $icon = $title.find('i');
          if ($icon.length) {
            $badge.insertBefore($icon);
          } else {
            $badge.appendTo($title);
          }
        }
        $badge.text(checkedCount);
        $fieldset.addClass('has-selected');
      } else {
        $badge.remove();
        $fieldset.removeClass('has-selected');
      }
    });
  }

  Drupal.behaviors.facetExposedFilters = {
    attach(context) {
      // 1. Инициализация глобальной подложки (строго один раз на body)
      once('facet-backdrop-init', 'body', context).forEach(() => {
        let $backdrop = $('.facet-backdrop');
        if (!$backdrop.length) {
          $backdrop = $('<div class="facet-backdrop"></div>').appendTo('body');
        }

        $backdrop.on('click', function () {
          $('.bef-exposed-form fieldset.open').removeClass('open');
          toggleBackdrop(false);
          activeMobileFilterSelector = null;
        });
      });

      // 2. Инициализация формы фильтров
      once('facet-exposed-form-init', '.bef-exposed-form', context).forEach((formElement) => {
        const $form = $(formElement);

        // Вставляем шапку с названием фильтра и крестиком в каждое модальное окно
        $form.find('fieldset').each(function () {
          const $fieldset = $(this);
          const $wrapper = $fieldset.find('.fieldset-wrapper');

          // Если шапка ещё не была добавлена
          if ($wrapper.length && !$wrapper.find('.facet-modal-header').length) {
            // Берём текст заголовка из .facet__title, исключая текст бейджа и иконки
            const $titleNode = $fieldset.find('legend .facet__title').clone();
            $titleNode.find('.facet__badge, i').remove();
            const filterTitle = $titleNode.text().trim();

            // Создаём шапку
            const $header = $(`
              <div class="facet-modal-header">
                <div class="facet-modal-title">${filterTitle}</div>
                <button type="button" class="facet-modal-close" aria-label="${Drupal.t('Закрыть')}">&times;</button>
              </div>
            `);

            // Вставляем в самое начало контента попапа
            $wrapper.prepend($header);
          }
        });

        // Делегирование: закрытие по клику на крестик
        $form.on('click', '.facet-modal-close', function (e) {
          e.preventDefault();
          e.stopPropagation();
          $form.find('fieldset.open').removeClass('open');
          toggleBackdrop(false);
          activeMobileFilterSelector = null;
        });

        // Актуализируем метки выбранных пунктов при начальной загрузке/AJAX
        updateFilterBadges($form);

        // Исключаем открытие мобильного бокового меню по свайпу на фильтрах
        $form.find('.form--inline').addClass('page-offside-disabled');

        // Проверяем: работает ли форма через AJAX или авто-отправку BEF
        const isAjaxOrAuto = $form.attr('data-bef-auto-submit') !== undefined ||
          $form.hasClass('views-ajax-processed');

        // Если AJAX выключен — добавляем кнопку «Применить» в модальные окна fieldset
        if (!isAjaxOrAuto) {
          $form.find('fieldset .fieldset-wrapper').each(function () {
            const $wrapper = $(this);
            if (!$wrapper.find('.facet-modal-actions').length) {
              const $actions = $(`
                <div class="facet-modal-actions">
                  <button type="button" class="button button--primary facet-apply-btn">
                    ${Drupal.t('Применить')}
                  </button>
                </div>
              `);
              $wrapper.append($actions);
            }
          });
        }

        // Обновление бейджа на лету при клике по чекбоксу
        $form.on('change', '.form-checkbox', function () {
          updateFilterBadges($form);
        });

        // Делегирование: клик по кнопке «Применить» внутри модального окна (без AJAX)
        $form.on('click', '.facet-apply-btn', function (e) {
          e.preventDefault();
          toggleBackdrop(false);
          $form.find('input[type="submit"].form-submit').first().click();
        });

        // Делегирование: предотвращение закрытия при кликах внутри выпавшего контента
        $form.on('click', '.fieldset-wrapper', function (e) {
          e.stopPropagation();
        });

        // Делегирование: клик по заголовку <legend>
        $form.on('click', 'fieldset legend', function (e) {
          const $legend = $(this);
          const $fieldset = $legend.closest('fieldset');
          const $wrapper = $fieldset.find('.fieldset-wrapper');
          const selectorId = $fieldset.attr('data-drupal-selector') || $fieldset.attr('id');

          if (isDesktop()) {
            // === ДЕСКТОП: классический аккордеон ===
            $fieldset.toggleClass('open');
            $wrapper.slideToggle(200);
          } else {
            // === МОБИЛЬНЫЙ / ПЛАНШЕТ: Центрированное модальное окно ===
            e.preventDefault();
            e.stopPropagation();

            const isAlreadyOpen = $fieldset.hasClass('open');

            // Закрываем другие открытые фильтры
            $form.find('fieldset.open').not($fieldset).removeClass('open');

            if (isAlreadyOpen) {
              $fieldset.removeClass('open');
              toggleBackdrop(false);
              activeMobileFilterSelector = null;
            } else {
              $fieldset.addClass('open');
              toggleBackdrop(true);
              activeMobileFilterSelector = selectorId;
            }
          }
        });
      });

      // 3. Восстановление открытого окна после AJAX-ответа
      if (!isDesktop() && activeMobileFilterSelector) {
        const $restored = $(`[data-drupal-selector="${activeMobileFilterSelector}"]`);
        if ($restored.length) {
          $restored.addClass('open');
          toggleBackdrop(true);
        } else {
          toggleBackdrop(false);
          activeMobileFilterSelector = null;
        }
      }
    },
  };
})(jQuery, Drupal, once);
