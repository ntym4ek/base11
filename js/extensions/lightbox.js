/**
 * @file
 * Интеграция лаконичного Vanilla JS лайтбокса (GLightbox) для Drupal 11.
 * Автоматически находит галереи в слайдерах Swiper, ссылки на изображения,
 * подтягивает подписи из alt/title и синхронизирует состояние со Swiper.
 */

((Drupal, once) => {
  'use strict';

  let lightboxInstance = null;

  // Регулярное выражение для проверки ссылок на графические файлы (с учетом параметров ?itok=...)
  const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|svg|gif|avif)(\?.*)?$/i;

  /**
   * Проверяет, ведет ли ссылка на графический файл.
   *
   * @param {HTMLAnchorElement} link
   * @return {boolean}
   */
  function isImageLink(link) {
    if (!link || !link.href) {
      return false;
    }
    // 1. Проверяем pathname (отсекает query параметры ?itok=... и #hash)
    const pathname = link.pathname || '';
    if (/\.(jpe?g|png|webp|svg|gif|avif)$/i.test(pathname)) {
      return true;
    }
    // 2. Проверяем полный raw href
    const rawHref = link.getAttribute('href') || link.href;
    if (IMAGE_EXT_REGEX.test(rawHref)) {
      return true;
    }
    // 3. Явные классы лайтбокса
    if (link.classList.contains('glightbox') || link.classList.contains('lightbox')) {
      return true;
    }
    return false;
  }

  /**
   * Синхронизирует активный кадр Swiper с текущим элементом лайтбокса.
   *
   * @param {HTMLElement} triggerNode - ссылка <a> текущего слайда.
   */
  function syncSwiper(triggerNode) {
    if (!triggerNode) {
      return;
    }
    const swiperSlide = triggerNode.closest('.swiper-slide');
    const swiperEl = triggerNode.closest('.swiper, .swiper-container, [data-swiper-formatter], .slider--w-thumbs');
    if (!swiperSlide || !swiperEl) {
      return;
    }

    const swiperInstance = swiperEl.swiper || swiperEl.querySelector('.swiper, .swiper-container')?.swiper;
    if (!swiperInstance) {
      return;
    }

    // Определяем индекс слайда
    const slides = Array.from(swiperSlide.parentElement.children);
    const realIndex = swiperSlide.dataset.swiperSlideIndex !== undefined
      ? Number(swiperSlide.dataset.swiperSlideIndex)
      : slides.indexOf(swiperSlide);

    if (realIndex !== -1) {
      if (swiperInstance.params && swiperInstance.params.loop && typeof swiperInstance.slideToLoop === 'function') {
        swiperInstance.slideToLoop(realIndex);
      } else if (typeof swiperInstance.slideTo === 'function' && swiperInstance.activeIndex !== realIndex) {
        swiperInstance.slideTo(realIndex);
      }
    }
  }

  /**
   * Подтягивает подписи (caption) из атрибутов alt/title вложенного <img>.
   *
   * @param {HTMLAnchorElement} link
   */
  function setupCaption(link) {
    const img = link.querySelector('img');
    if (!img) {
      return;
    }

    const altText = (img.getAttribute('alt') || '').trim();
    const titleText = (img.getAttribute('title') || '').trim();

    // Если у ссылки еще не заданы собственные data-title или data-description
    if (!link.dataset.title && !link.dataset.description && !link.getAttribute('title')) {
      if (titleText && altText && titleText !== altText) {
        link.dataset.title = titleText;
        link.dataset.description = altText;
      } else if (altText) {
        link.dataset.description = altText;
      } else if (titleText) {
        link.dataset.description = titleText;
      }
    }
  }

  Drupal.behaviors.base11Lightbox = {
    attach(context) {
      if (typeof GLightbox !== 'function') {
        return;
      }

      // 1. Автоматический поиск и группировка изображений внутри слайдеров Swiper
      const swiperContainers = once(
        'swiper-lightbox-init',
        '.swiper, .swiper-container, [data-swiper-formatter], .slider--w-thumbs',
        context
      );

      swiperContainers.forEach((swiperEl, swiperIdx) => {
        // Исключаем контейнеры навигационных превьюшек (thumbs)
        if (swiperEl.classList.contains('swiper-thumbs') || swiperEl.closest('.swiper-thumbs')) {
          return;
        }

        // Ищем все ссылки внутри слайдов основного слайдера
        const slideLinks = swiperEl.querySelectorAll('.swiper-slide a');
        if (!slideLinks.length) {
          return;
        }

        const galleryId = swiperEl.id ? `swiper-${swiperEl.id}` : `swiper-gallery-${swiperIdx}`;

        slideLinks.forEach((link) => {
          if (link.closest('.swiper-thumbs') || link.dataset.noLightbox !== undefined) {
            return;
          }

          if (isImageLink(link)) {
            link.classList.add('glightbox');
            if (!link.dataset.gallery) {
              link.dataset.gallery = galleryId;
            }
            setupCaption(link);
          }
        });
      });

      // 2. Автоматический поиск одиночных ссылок на изображения вне слайдеров
      once('auto-image-lightbox', 'a', context).forEach((link) => {
        if (
          link.closest('.swiper, .swiper-container, [data-swiper-formatter], .swiper-thumbs') ||
          link.dataset.noLightbox !== undefined
        ) {
          return;
        }

        if (isImageLink(link) && (link.querySelector('img') || link.classList.contains('lightbox') || link.classList.contains('glightbox'))) {
          link.classList.add('glightbox');
          setupCaption(link);
        }
      });

      // 3. Инициализация / обновление экземпляра GLightbox
      const lightboxElements = document.querySelectorAll('.glightbox, a.lightbox');
      if (!lightboxElements.length) {
        return;
      }

      if (lightboxInstance) {
        lightboxInstance.reload();
      } else {
        lightboxInstance = GLightbox({
          selector: '.glightbox, a.lightbox',
          touchNavigation: true,
          loop: true,
          zoomable: true,
          autoplayVideos: true,
          openEffect: 'fade',
          closeEffect: 'fade',
          descPosition: 'bottom',
        });

        let lastActiveTrigger = null;

        // Синхронизация при листании внутри лайтбокса
        lightboxInstance.on('slide_changed', ({ current }) => {
          const trigger = current?.trigger || current?.node || (lightboxInstance.elements?.[current?.slideIndex]?.node);
          if (trigger) {
            lastActiveTrigger = trigger;
            syncSwiper(trigger);
          }
        });

        // Синхронизация при закрытии лайтбокса:
        // Swiper на странице остается на том слайде, на котором лайтбокс был закрыт
        lightboxInstance.on('close', () => {
          if (lastActiveTrigger) {
            syncSwiper(lastActiveTrigger);
          } else if (lightboxInstance.index !== undefined && lightboxInstance.elements?.[lightboxInstance.index]?.node) {
            syncSwiper(lightboxInstance.elements[lightboxInstance.index].node);
          }
        });
      }
    },
  };

})(Drupal, once);
