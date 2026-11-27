/**
 * @file
 * Двусторонняя синхронизация миниатюр (thumbs) с основным слайдером Swiper (модуль swiper_formatter).
 */

((Drupal, settings, once) => {
  'use strict';

  /**
   * Разбирает булево значение из data-атрибута.
   *
   * @param {string|undefined} value
   *   Значение атрибута.
   * @param {boolean} fallback
   *   Значение по умолчанию.
   *
   * @return {boolean}
   *   Разобранное булево значение.
   */
  function parseBoolAttr(value, fallback) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
  }

  /**
   * Разбирает JSON-карту брейкпоинтов из data-атрибута.
   *
   * @param {string|undefined} raw
   *   JSON-строка с брейкпоинтами Swiper.
   *
   * @return {Object|null}
   *   Объект брейкпоинтов или null при отсутствии / ошибке парсинга.
   */
  function parseBreakpointsAttr(raw) {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
    catch {
      // Игнорируем некорректный JSON, чтобы не блокировать инициализацию миниатюр.
    }
    return null;
  }

  /**
   * Подключает блок .swiper-thumbs как пагинатор-миниатюры к родительскому Swiper
   * с идентификатором из атрибута data-parent-swiper-id.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.swiperThumbs = {
    attach(context) {
      once('swiper-thumbs-once', '.swiper-thumbs', context).forEach((element) => {
        const parentId = element.dataset.parentSwiperId;
        if (!parentId) return;

        // Ищем экземпляр родительского слайдера в drupalSettings или прямо на DOM-элементе
        // (устойчиво к повторным AJAX-вызовам Drupal.attachBehaviors).
        const parentSwiper = settings.swipers?.[parentId] || document.getElementById(parentId)?.swiper;
        if (!parentSwiper?.thumbs) return;

        // Используем конструктор родительского слайдера, чтобы instanceof SwiperClass
        // в модуле Thumbs Swiper 11 всегда срабатывал корректно.
        const SwiperCtor = parentSwiper.constructor
          || (typeof Swiper !== 'undefined' ? Swiper : (window.SwiperFormatter ?? null));
        if (!SwiperCtor) return;

        const direction = element.dataset.thumbsDirection === 'horizontal' ? 'horizontal' : 'vertical';

        const parsedSpace = Number.parseInt(element.dataset.thumbsSpaceBetween ?? '', 10);
        const spaceBetween = Number.isFinite(parsedSpace) && parsedSpace >= 0 ? parsedSpace : 20;

        const rawPerView = element.dataset.thumbsSlidesPerView;
        const parsedPerView = Number.parseFloat(rawPerView ?? '');
        const slidesPerView = rawPerView && rawPerView !== 'auto' && Number.isFinite(parsedPerView) && parsedPerView > 0
          ? parsedPerView
          : 'auto';

        const freeMode = parseBoolAttr(element.dataset.thumbsFreeMode, false);
        const hasExplicitMousewheel = element.dataset.thumbsMousewheel !== undefined;
        // Для горизонтальной полосы отключаем mousewheel по умолчанию, чтобы не перехватывать скролл страницы.
        const mousewheel = parseBoolAttr(element.dataset.thumbsMousewheel, direction === 'vertical');

        const parsedOffset = Number.parseInt(element.dataset.thumbsAutoScrollOffset ?? '', 10);
        const autoScrollOffset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : null;

        const breakpoints = parseBreakpointsAttr(element.dataset.thumbsBreakpoints);

        const thumbsOptions = {
          direction,
          spaceBetween,
          slidesPerView,
          freeMode,
          watchSlidesProgress: true,
          mousewheel,
          resizeObserver: true,
        };
        if (breakpoints) {
          thumbsOptions.breakpoints = breakpoints;
        }

        const thumbsSwiper = new SwiperCtor(element, thumbsOptions);

        // Передаём экземпляр через params.thumbs.swiper, как требует Swiper 11 перед init().
        parentSwiper.params.thumbs.swiper = thumbsSwiper;
        if (autoScrollOffset !== null) {
          parentSwiper.params.thumbs.autoScrollOffset = autoScrollOffset;
        }
        parentSwiper.thumbs.init();
        parentSwiper.thumbs.update(true);
        parentSwiper.update();

        // При смене брейкпоинта синхронизируем mousewheel и размеры лент.
        if (breakpoints) {
          thumbsSwiper.on('breakpoint', () => {
            if (!hasExplicitMousewheel && thumbsSwiper.mousewheel) {
              if (thumbsSwiper.isVertical()) {
                thumbsSwiper.mousewheel.enable();
              }
              else {
                thumbsSwiper.mousewheel.disable();
              }
            }
            thumbsSwiper.update();
            parentSwiper.thumbs.update();
          });
        }

        // Поддержка активации миниатюры с клавиатуры (Enter / Space).
        element.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;

          const slide = event.target.closest('.swiper-slide');
          if (!slide || !element.contains(slide)) return;

          const index = thumbsSwiper.slides.indexOf(slide);
          if (index < 0) return;

          event.preventDefault();
          if (parentSwiper.params?.loop && typeof parentSwiper.slideToLoop === 'function') {
            parentSwiper.slideToLoop(index);
          }
          else {
            parentSwiper.slideTo(index);
          }
        });
      });
    },
  };
})(Drupal, drupalSettings, once);

//<editor-fold defaultstate="collapsed" desc="Описание: настройка data-thumbs-* и пример разметки">
// Поддерживаемые data-атрибуты на элементе .swiper-thumbs:
// - data-parent-swiper-id (обязательный) — HTML id родительского .swiper-container;
// - data-thumbs-direction — 'horizontal' или 'vertical' (по умолчанию 'vertical');
// - data-thumbs-space-between — отступ между миниатюрами в px (по умолчанию 20);
// - data-thumbs-slides-per-view — 'auto' или положительное число (по умолчанию 'auto');
// - data-thumbs-free-mode — 'true' / 'false' (по умолчанию 'false');
// - data-thumbs-mousewheel — 'true' / 'false' (по умолчанию 'true' для vertical и 'false' для horizontal);
// - data-thumbs-auto-scroll-offset — неотрицательное целое смещение автопрокрутки активной миниатюры;
// - data-thumbs-breakpoints — JSON-карта брейкпоинтов Swiper (например, для смены horizontal -> vertical на 768px).
//
// Пример адаптивной разметки (снизу на смартфонах, вертикально слева с 768px):
// <div class="swiper swiper-thumbs"
//      data-parent-swiper-id="{{ id }}"
//      data-thumbs-direction="horizontal"
//      data-thumbs-slides-per-view="4"
//      data-thumbs-space-between="12"
//      data-thumbs-free-mode="true"
//      data-thumbs-auto-scroll-offset="1"
//      data-thumbs-breakpoints='{"768":{"direction":"vertical","slidesPerView":"auto","spaceBetween":12,"mousewheel":true}}'>
//   <div class="swiper-wrapper">
//     <div class="swiper-slide" role="button" tabindex="0">...</div>
//   </div>
// </div>
//</editor-fold>
