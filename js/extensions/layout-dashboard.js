/**
 * @file
 * Управление выдвижной боковой панелью дашборда (base11/layout-dashboard).
 */
((Drupal, once) => {
  'use strict';

  // Порог перехода к закреплённому сайдбару (соответствует $laptop в base11)
  const isDesktop = () => window.matchMedia('(min-width: 1366px)').matches;

  /**
   * Синхронизирует состояние открытой боковой панели и ARIA-атрибутов.
   *
   * @param {HTMLElement} root
   * @param {boolean} isOpen
   */
  function setSidebarState(root, isOpen) {
    root.classList.toggle('is-sidebar-open', isOpen);

    root.querySelectorAll('[data-b11-dashboard-toggle]').forEach((btn) => {
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    const sidebar = root.querySelector('.b11-dashboard__sidebar');
    if (sidebar && !isDesktop()) {
      sidebar.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    } else if (sidebar) {
      sidebar.removeAttribute('aria-hidden');
    }
  }

  Drupal.behaviors.base11LayoutDashboard = {
    attach(context) {
      once('base11-layout-dashboard', '.b11-dashboard', context).forEach((root) => {
        let lastTrigger = null;

        // Переключатели открытия/закрытия боковой панели
        root.querySelectorAll('[data-b11-dashboard-toggle]').forEach((trigger) => {
          trigger.setAttribute('aria-expanded', 'false');
          trigger.addEventListener('click', () => {
            const willOpen = !root.classList.contains('is-sidebar-open');
            lastTrigger = willOpen ? trigger : lastTrigger;
            setSidebarState(root, willOpen);

            if (willOpen) {
              const sidebar = root.querySelector('.b11-dashboard__sidebar');
              const focusTarget = sidebar?.querySelector('a, button, input, select, [tabindex]:not([tabindex="-1"])');
              if (focusTarget) {
                focusTarget.focus();
              }
            }
          });
        });

        // Кнопки принудительного закрытия и подложка backdrop
        root.querySelectorAll('[data-b11-dashboard-close], .b11-dashboard__backdrop').forEach((closer) => {
          closer.addEventListener('click', () => {
            setSidebarState(root, false);
            if (lastTrigger) {
              lastTrigger.focus();
            }
          });
        });

        // Закрытие по Escape на узких экранах
        root.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && root.classList.contains('is-sidebar-open') && !isDesktop()) {
            setSidebarState(root, false);
            if (lastTrigger) {
              lastTrigger.focus();
            }
          }
        });

        // Автосброс мобильного состояния при переходе на широкий экран
        const mq = window.matchMedia('(min-width: 1366px)');
        mq.addEventListener('change', (e) => {
          if (e.matches) {
            setSidebarState(root, false);
          }
        });
      });
    },
  };
})(Drupal, once);
