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
        // Для горизонтальной полосы отключаем mousewheel по умолчанию, чтобы не перехватывать скролл страницы.
        const mousewheel = parseBoolAttr(element.dataset.thumbsMousewheel, direction === 'vertical');

        const parsedOffset = Number.parseInt(element.dataset.thumbsAutoScrollOffset ?? '', 10);
        const autoScrollOffset = Number.isInteger(parsedOffset) && parsedOffset >= 0 ? parsedOffset : null;

        const thumbsSwiper = new SwiperCtor(element, {
          direction,
          spaceBetween,
          slidesPerView,
          freeMode,
          watchSlidesProgress: true,
          mousewheel,
        });

        // Передаём экземпляр через params.thumbs.swiper, как требует Swiper 11 перед init().
        parentSwiper.params.thumbs.swiper = thumbsSwiper;
        if (autoScrollOffset !== null) {
          parentSwiper.params.thumbs.autoScrollOffset = autoScrollOffset;
        }
        parentSwiper.thumbs.init();
        parentSwiper.thumbs.update(true);
        parentSwiper.update();

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
// - data-thumbs-auto-scroll-offset — неотрицательное целое смещение автопрокрутки активной миниатюры.
//
// Пример разметки горизонтальных миниатюр под основным слайдером:
// <div class="swiper swiper-thumbs"
//      data-parent-swiper-id="{{ id }}"
//      data-thumbs-direction="horizontal"
//      data-thumbs-slides-per-view="4"
//      data-thumbs-space-between="12"
//      data-thumbs-free-mode="true"
//      data-thumbs-auto-scroll-offset="1">
//   <div class="swiper-wrapper">
//     <div class="swiper-slide" role="button" tabindex="0">...</div>
//   </div>
// </div>
//</editor-fold>
