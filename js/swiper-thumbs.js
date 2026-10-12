/**
 * @file
 * Добавить модулю swiper_formatter возможность вывода пагинатора в виде thumbs
 */

((Drupal, settings, once) => {
  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   * Инициализировать свайперы с классом swiper-thumbs
   * и задать их в свойстве thumbs для родительских свайперов с id,
   * указанном в атрибуте data-parent-swiper-id
   */
  Drupal.behaviors.swiperThumbs = {
    attach(context) {
      once('swiper-thumbs-once', '.swiper-thumbs', context).forEach(
        (element) => {
          let parentId = element.dataset.parentSwiperId;

          if (parentId) {
            const swiper = typeof Swiper !== 'undefined' ? Swiper : (window.SwiperFormatter ?? null);
            if (swiper) {
              let sw = new swiper(element, {
                direction: 'vertical',
                spaceBetween: 20,
                slidesPerView: 'auto',
                watchSlidesProgress: true,
                mousewheel: true,
              });

              let parentSwiper = drupalSettings.swipers[parentId];
              if (parentSwiper) {
                parentSwiper.thumbs.swiper = sw;
                parentSwiper.thumbs.init();
                parentSwiper.update();
              }
            }
          }
        }
      );
    },
  };

})(Drupal, drupalSettings, once);
