/**
 * @file
 * Двусторонняя синхронизация миниатюр (thumbs) с основным слайдером Swiper (модуль swiper_formatter).
 */

((Drupal, settings, once) => {
  'use strict';

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

        const SwiperCtor = typeof Swiper !== 'undefined' ? Swiper : (window.SwiperFormatter ?? null);
        if (!SwiperCtor) return;

        const thumbsSwiper = new SwiperCtor(element, {
          direction: 'vertical',
          spaceBetween: 20,
          slidesPerView: 'auto',
          watchSlidesProgress: true,
          mousewheel: true,
        });

        const parentSwiper = settings.swipers?.[parentId];
        if (parentSwiper?.thumbs) {
          parentSwiper.thumbs.swiper = thumbsSwiper;
          parentSwiper.thumbs.init();
          parentSwiper.update();
        }
      });
    },
  };
})(Drupal, drupalSettings, once);
