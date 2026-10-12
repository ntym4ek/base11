/**
 * @file
 * Кнопка возврата к началу страницы (Vanilla JS для Drupal 11 без jQuery).
 */

((Drupal, once) => {
  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   При скролле страницы вниз показать кнопку.
   *   При нажатии на кнопку выполнить плавный скролл к началу страницы.
   */
  Drupal.behaviors.backToTop = {
    attach(context) {
      once('back-to-top-once', '[data-drupal-selector="back-to-top"]', context).forEach(
        (element) => {
          window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
              element.classList.add('is-visible');
            } else {
              element.classList.remove('is-visible');
            }
          }, { passive: true });

          element.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
      );
    },
  };
})(Drupal, once);
