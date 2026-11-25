/**
 * @file
 * Интерактивное поведение компактной строки поиска с автокомплитом (base11/search-bar).
 *
 * Атрибуты контейнера [data-b11-search]:
 * - data-b11-search-url   — URL JSON-эндпоинта (принимает ?q=...). Если не задан, работают очистка и отправка формы.
 * - data-b11-search-min   — минимальная длина запроса для автокомплита (по умолчанию 2).
 * - data-b11-search-delay — задержка debounce в мс (по умолчанию 250).
 */
((Drupal, once) => {
  'use strict';

  let instanceCounter = 0;

  /**
   * Экранирует спецсимволы регулярных выражений.
   *
   * @param {string} value
   * @return {string}
   */
  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Заполняет элемент текстом с безопасной подсветкой совпавших токенов запроса.
   *
   * @param {HTMLElement} container
   * @param {string} text
   * @param {string} query
   */
  function renderHighlightedText(container, text, query) {
    container.textContent = '';
    const tokens = query
      .trim()
      .split(/\s+/)
      .filter((token) => token.length >= 2)
      .map(escapeRegExp);

    if (!tokens.length) {
      container.textContent = text;
      return;
    }

    const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(pattern);

    parts.forEach((part, index) => {
      if (!part) {
        return;
      }
      if (index % 2 === 1) {
        const mark = document.createElement('mark');
        mark.textContent = part;
        container.appendChild(mark);
      }
      else {
        container.appendChild(document.createTextNode(part));
      }
    });
  }

  /**
   * Инициализирует виджет строки поиска.
   *
   * @param {HTMLElement} root
   */
  function initSearchBar(root) {
    const input = root.querySelector('.b11-search__input');
    const clearBtn = root.querySelector('.b11-search__clear');
    const dropdown = root.querySelector('.b11-search__dropdown');

    if (!input) {
      return;
    }

    const endpoint = root.getAttribute('data-b11-search-url') || '';
    const minChars = Math.max(1, parseInt(root.getAttribute('data-b11-search-min') || '2', 10) || 2);
    const delay = Math.max(0, parseInt(root.getAttribute('data-b11-search-delay') || '250', 10) || 250);

    const uid = ++instanceCounter;
    const listboxId = `b11-search-listbox-${uid}`;

    let debounceTimer = null;
    let abortController = null;
    let activeIndex = -1;
    let navItems = [];

    if (dropdown && endpoint) {
      dropdown.id = listboxId;
      dropdown.setAttribute('role', 'listbox');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-controls', listboxId);
      input.setAttribute('aria-expanded', 'false');
    }

    /**
     * Обновляет видимость кнопки очистки поля.
     */
    function syncClearButton() {
      if (!clearBtn) {
        return;
      }
      const hasValue = input.value.length > 0;
      clearBtn.classList.toggle('is-visible', hasValue);
      clearBtn.tabIndex = hasValue ? 0 : -1;
    }

    /**
     * Закрывает выпадающий список и сбрасывает активный элемент.
     */
    function closeDropdown() {
      if (!dropdown) {
        return;
      }
      dropdown.hidden = true;
      dropdown.innerHTML = '';
      navItems = [];
      activeIndex = -1;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
    }

    /**
     * Открывает выпадающий список.
     */
    function openDropdown() {
      if (!dropdown) {
        return;
      }
      dropdown.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    /**
     * Показывает текстовое состояние внутри выпадающего списка.
     *
     * @param {string} message
     */
    function renderStatus(message) {
      if (!dropdown) {
        return;
      }
      dropdown.innerHTML = '';
      navItems = [];
      activeIndex = -1;

      const status = document.createElement('div');
      status.className = 'b11-search__status';
      status.textContent = message;
      dropdown.appendChild(status);
      openDropdown();
    }

    /**
     * Выделяет элемент списка для клавиатурной навигации.
     *
     * @param {number} index
     */
    function setActiveIndex(index) {
      navItems.forEach((el) => el.classList.remove('is-active'));
      activeIndex = index;

      if (index < 0 || index >= navItems.length) {
        activeIndex = -1;
        input.removeAttribute('aria-activedescendant');
        return;
      }

      const activeEl = navItems[index];
      activeEl.classList.add('is-active');
      if (activeEl.id) {
        input.setAttribute('aria-activedescendant', activeEl.id);
      }
      activeEl.scrollIntoView({ block: 'nearest' });
    }

    /**
     * Рендерит полученные подсказки автокомплита.
     *
     * @param {Object} data
     * @param {string} query
     */
    function renderResults(data, query) {
      if (!dropdown) {
        return;
      }

      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        renderStatus(Drupal.t('Nothing found'));
        return;
      }

      dropdown.innerHTML = '';
      navItems = [];
      activeIndex = -1;

      const list = document.createElement('ul');
      list.className = 'b11-search__list';

      items.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'b11-search__item';
        li.id = `${listboxId}-opt-${idx}`;
        li.setAttribute('role', 'option');

        const link = document.createElement('a');
        link.className = 'b11-search__link';
        link.href = item.url || '#';
        link.tabIndex = -1;

        if (item.image) {
          const img = document.createElement('img');
          img.className = 'b11-search__thumb';
          img.src = item.image;
          img.alt = '';
          img.loading = 'lazy';
          link.appendChild(img);
        }

        const body = document.createElement('span');
        body.className = 'b11-search__body';

        const title = document.createElement('span');
        title.className = 'b11-search__title';
        renderHighlightedText(title, item.title || '', query);
        body.appendChild(title);

        if (item.meta) {
          const meta = document.createElement('span');
          meta.className = 'b11-search__meta';
          meta.textContent = item.meta;
          body.appendChild(meta);
        }

        link.appendChild(body);
        li.appendChild(link);
        list.appendChild(li);
        navItems.push(li);
      });

      dropdown.appendChild(list);

      if (data.all_url) {
        const footer = document.createElement('div');
        footer.className = 'b11-search__footer';

        const allLink = document.createElement('a');
        allLink.className = 'b11-search__all';
        allLink.id = `${listboxId}-all`;
        allLink.href = data.all_url;
        allLink.tabIndex = -1;

        const total = typeof data.total === 'number' ? data.total : items.length;
        allLink.textContent = Drupal.t('Show all results (@count)', { '@count': total });

        footer.appendChild(allLink);
        dropdown.appendChild(footer);
        navItems.push(allLink);
      }

      openDropdown();
    }

    /**
     * Загружает подсказки с сервера.
     *
     * @param {string} query
     */
    async function fetchSuggestions(query) {
      if (!endpoint || !dropdown) {
        return;
      }

      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      renderStatus(Drupal.t('Searching...'));

      try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const url = `${endpoint}${separator}q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          signal: abortController.signal,
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          closeDropdown();
          return;
        }

        const data = await response.json();
        if (input.value.trim() !== query) {
          return;
        }
        renderResults(data, query);
      }
      catch (err) {
        if (err.name !== 'AbortError') {
          closeDropdown();
        }
      }
    }

    syncClearButton();

    input.addEventListener('input', () => {
      syncClearButton();
      clearTimeout(debounceTimer);

      const query = input.value.trim();
      if (!endpoint || query.length < minChars) {
        if (abortController) {
          abortController.abort();
        }
        closeDropdown();
        return;
      }

      debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
      }, delay);
    });

    input.addEventListener('keydown', (event) => {
      if (!dropdown || dropdown.hidden || !navItems.length) {
        if (event.key === 'Escape') {
          closeDropdown();
        }
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const next = activeIndex + 1 >= navItems.length ? 0 : activeIndex + 1;
        setActiveIndex(next);
      }
      else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prev = activeIndex - 1 < 0 ? navItems.length - 1 : activeIndex - 1;
        setActiveIndex(prev);
      }
      else if (event.key === 'Enter' && activeIndex >= 0) {
        const activeEl = navItems[activeIndex];
        const targetLink = activeEl.tagName === 'A' ? activeEl : activeEl.querySelector('a');
        if (targetLink && targetLink.href) {
          event.preventDefault();
          window.location.assign(targetLink.href);
        }
      }
      else if (event.key === 'Escape') {
        event.preventDefault();
        closeDropdown();
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        syncClearButton();
        clearTimeout(debounceTimer);
        if (abortController) {
          abortController.abort();
        }
        closeDropdown();
        input.focus();
      });
    }

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) {
        closeDropdown();
      }
    });

    root.addEventListener('focusout', (event) => {
      if (event.relatedTarget && !root.contains(event.relatedTarget)) {
        closeDropdown();
      }
    });
  }

  /**
   * Drupal behavior для строки поиска base11/search-bar.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.base11SearchBar = {
    attach(context) {
      once('b11-search-bar', '[data-b11-search]', context).forEach(initSearchBar);
    },
  };
})(Drupal, once);
