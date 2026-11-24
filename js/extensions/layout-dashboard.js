/**
 * @file
 * Управление боковой панелью дашборда (мобильная шторка + Desktop Rail Mode) (base11/layout-dashboard).
 */
((Drupal, once) => {
  'use strict';

  const STORAGE_KEY = 'b11_sidebar_collapsed';

  // Порог перехода к закреплённому сайдбару (соответствует $laptop в base11)
  const isDesktop = () => window.matchMedia('(min-width: 1366px)').matches;

  /**
   * Безопасное чтение/запись состояния рельсы в localStorage.
   */
  function readCollapsedState() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function writeCollapsedState(isCollapsed) {
    try {
      window.localStorage.setItem(STORAGE_KEY, isCollapsed ? '1' : '0');
    } catch {
      // Игнорируем ограничения хранилища в приватном режиме браузера.
    }
  }

  /**
   * Синхронизирует состояние открытой мобильной шторки и ARIA-атрибутов.
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

  /**
   * Переключает компактный иконочный режим сайдбара (Desktop Rail Mode)
   * и уведомляет вложенные графики/виджеты об изменении геометрии.
   *
   * @param {HTMLElement} root
   * @param {boolean} isCollapsed
   * @param {boolean} persist
   */
  function setRailCollapsed(root, isCollapsed, persist = true) {
    root.classList.toggle('is-sidebar-collapsed', isCollapsed);

    root.querySelectorAll('[data-b11-sidebar-collapse]').forEach((btn) => {
      btn.setAttribute('aria-pressed', isCollapsed ? 'true' : 'false');
    });

    // В свёрнутом состоянии добавляем title-подсказку по тексту пункта меню
    root.querySelectorAll('.b11-dashboard__link').forEach((link) => {
      if (isCollapsed) {
        if (!link.getAttribute('title')) {
          const textEl = link.querySelector('.b11-dashboard__link-text');
          const label = (textEl ? textEl.textContent : link.textContent).trim();
          if (label) {
            link.setAttribute('title', label);
            link.dataset.b11AutoTitle = '1';
          }
        }
      } else if (link.dataset.b11AutoTitle === '1') {
        link.removeAttribute('title');
        delete link.dataset.b11AutoTitle;
      }
    });

    if (persist) {
      writeCollapsedState(isCollapsed);
    }

    const notifyLayout = () => {
      root.dispatchEvent(new CustomEvent('b11:layout-change', {
        bubbles: true,
        detail: { collapsed: isCollapsed },
      }));
    };

    notifyLayout();
    window.setTimeout(notifyLayout, 220);
  }

  Drupal.behaviors.base11LayoutDashboard = {
    attach(context) {
      once('base11-layout-dashboard', '.b11-dashboard', context).forEach((root) => {
        let lastTrigger = null;

        // Восстановление состояния Desktop Rail Mode из localStorage
        const initialCollapsed = root.classList.contains('is-sidebar-collapsed') || readCollapsedState();
        if (initialCollapsed) {
          setRailCollapsed(root, true, false);
        }

        // Переключатель компактной рельсы на десктопах
        root.querySelectorAll('[data-b11-sidebar-collapse]').forEach((btn) => {
          btn.setAttribute('aria-pressed', root.classList.contains('is-sidebar-collapsed') ? 'true' : 'false');
          btn.addEventListener('click', () => {
            const nextState = !root.classList.contains('is-sidebar-collapsed');
            setRailCollapsed(root, nextState, true);
          });
        });

        // Переключатели открытия/закрытия мобильной боковой панели
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
          root.dispatchEvent(new CustomEvent('b11:layout-change', {
            bubbles: true,
            detail: { desktop: e.matches },
          }));
        });
      });
    },
  };
})(Drupal, once);
