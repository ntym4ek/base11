/**
 * @file
 * Контроллер древовидных таблиц, живого поиска и клиентской сортировки (base11/table-interactive).
 *
 * Атрибуты:
 * - [data-b11-tree-table]              — включает иерархическое сворачивание строк (data-row-id / data-parent-id)
 * - [data-b11-row-toggle]              — кнопка раскрытия/сворачивания внутри строки
 * - [data-b11-tree-expand-all="#id"]   — кнопка «Развернуть всё»
 * - [data-b11-tree-collapse-all="#id"] — кнопка «Свернуть всё»
 * - [data-b11-table-search="#id"]      — поле живого поиска по строкам таблицы
 * - th[data-sort="number|text|date"]   — заголовок колонки с клиентской сортировкой
 */
((Drupal, once) => {
  'use strict';

  /**
   * Читает сохранённые ID раскрытых узлов дерева из sessionStorage.
   *
   * @param {HTMLTableElement} table
   * @return {Set<string>}
   */
  function loadExpandedIds(table) {
    const key = table.dataset.b11TreeKey || table.id;
    if (!key) return new Set();
    try {
      const raw = window.sessionStorage.getItem(`b11_tree_${key}`);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
    } catch {
      return new Set();
    }
  }

  /**
   * Сохраняет текущее множество раскрытых узлов в sessionStorage.
   *
   * @param {HTMLTableElement} table
   */
  function saveExpandedIds(table) {
    const key = table.dataset.b11TreeKey || table.id;
    if (!key) return;
    const expanded = [];
    table.querySelectorAll('tbody tr[data-row-id].is-expanded').forEach((row) => {
      expanded.push(row.dataset.rowId);
    });
    try {
      window.sessionStorage.setItem(`b11_tree_${key}`, JSON.stringify(expanded));
    } catch {
      // Игнорируем ограничения sessionStorage.
    }
  }

  /**
   * Обновляет визуальное состояние кнопки переключения строки (+/-) и ARIA.
   *
   * @param {HTMLTableRowElement} row
   * @param {boolean} isExpanded
   */
  function updateRowToggleUi(row, isExpanded) {
    row.classList.toggle('is-expanded', isExpanded);
    const toggle = row.querySelector('[data-b11-row-toggle]');
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    if (toggle.children.length === 0) {
      toggle.textContent = isExpanded ? '−' : '+';
    }
  }

  /**
   * Синхронизирует видимость строк дерева с учётом раскрытых родителей и поискового запроса.
   *
   * @param {HTMLTableElement} table
   */
  function syncTreeVisibility(table) {
    const rows = Array.from(table.querySelectorAll('tbody tr[data-row-id]'));
    const rowById = new Map();
    rows.forEach((row) => {
      rowById.set(row.dataset.rowId, row);
    });

    const query = (table.dataset.b11SearchQuery || '').trim().toLowerCase();
    const emptyRow = table.querySelector('tbody tr.b11-table-empty');

    if (query) {
      const visibleIds = new Set();
      rows.forEach((row) => {
        const text = (row.dataset.searchText || row.textContent || '').toLowerCase();
        if (text.includes(query)) {
          visibleIds.add(row.dataset.rowId);
          // Автоматически показываем всех предков найденной строки
          let parentId = row.dataset.parentId;
          while (parentId && rowById.has(parentId)) {
            visibleIds.add(parentId);
            parentId = rowById.get(parentId).dataset.parentId;
          }
        }
      });

      rows.forEach((row) => {
        row.classList.toggle('is-tree-hidden', !visibleIds.has(row.dataset.rowId));
      });

      if (emptyRow) {
        emptyRow.classList.toggle('is-tree-hidden', visibleIds.size > 0);
      }
      return;
    }

    rows.forEach((row) => {
      let visible = true;
      let parentId = row.dataset.parentId;
      while (parentId && rowById.has(parentId)) {
        const parentRow = rowById.get(parentId);
        if (!parentRow.classList.contains('is-expanded')) {
          visible = false;
          break;
        }
        parentId = parentRow.dataset.parentId;
      }
      row.classList.toggle('is-tree-hidden', !visible);
    });

    if (emptyRow) {
      emptyRow.classList.add('is-tree-hidden');
    }
  }

  /**
   * Применяет поиск к обычной (плоской) таблице без иерархии.
   *
   * @param {HTMLTableElement} table
   * @param {string} rawQuery
   */
  function filterFlatTable(table, rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    let visibleCount = 0;
    const rows = Array.from(tbody.querySelectorAll('tr:not(.b11-table-empty):not(.tfoot):not([data-b11-pin-bottom])'));
    rows.forEach((row) => {
      const text = (row.dataset.searchText || row.textContent || '').toLowerCase();
      const matched = !query || text.includes(query);
      row.style.display = matched ? '' : 'none';
      if (matched) visibleCount++;
    });

    const emptyRow = tbody.querySelector('tr.b11-table-empty');
    if (emptyRow) {
      emptyRow.style.display = visibleCount === 0 ? '' : 'none';
    }
  }

  /**
   * Преобразует значение ячейки в сравнимый ключ по типу сортировки.
   *
   * @param {HTMLTableCellElement} cell
   * @param {string} sortType
   * @return {number|string}
   */
  function extractSortValue(cell, sortType) {
    if (!cell) return sortType === 'number' || sortType === 'date' ? 0 : '';
    const raw = (cell.dataset.sortValue !== undefined ? cell.dataset.sortValue : cell.textContent).trim();

    if (sortType === 'number') {
      const normalized = raw.replace(/\s+/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
      const num = Number.parseFloat(normalized);
      return Number.isFinite(num) ? num : 0;
    }

    if (sortType === 'date') {
      if (raw === '' || raw === '-' || raw === '—') return 0;
      const ruMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
      if (ruMatch) {
        return Date.UTC(
          Number(ruMatch[3]),
          Number(ruMatch[2]) - 1,
          Number(ruMatch[1]),
          Number(ruMatch[4] || 0),
          Number(ruMatch[5] || 0)
        );
      }
      const parsed = Date.parse(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return raw.toLowerCase();
  }

  /**
   * Сортирует строки таблицы (с сохранением иерархии для древовидных таблиц).
   *
   * @param {HTMLTableElement} table
   * @param {number} colIndex
   * @param {string} sortType
   * @param {'asc'|'desc'} direction
   */
  function sortTable(table, colIndex, sortType, direction) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const factor = direction === 'asc' ? 1 : -1;
    const pinnedBottom = Array.from(tbody.querySelectorAll('tr.tfoot, tr[data-b11-pin-bottom], tr.b11-table-empty'));
    const allRows = Array.from(tbody.querySelectorAll('tr')).filter((r) => !pinnedBottom.includes(r));

    const compareRows = (a, b) => {
      const valA = extractSortValue(a.children[colIndex], sortType);
      const valB = extractSortValue(b.children[colIndex], sortType);
      if (sortType === 'number' || sortType === 'date') {
        return (valA - valB) * factor;
      }
      return String(valA).localeCompare(String(valB), 'ru') * factor;
    };

    const fragment = document.createDocumentFragment();

    if (table.hasAttribute('data-b11-tree-table')) {
      const childrenByParent = new Map();
      allRows.forEach((row) => {
        const pid = row.dataset.parentId || '';
        if (!childrenByParent.has(pid)) {
          childrenByParent.set(pid, []);
        }
        childrenByParent.get(pid).push(row);
      });

      const appendSubtree = (parentId) => {
        const group = childrenByParent.get(parentId);
        if (!group) return;
        group.sort(compareRows);
        group.forEach((row) => {
          fragment.appendChild(row);
          if (row.dataset.rowId) {
            appendSubtree(row.dataset.rowId);
          }
        });
      };

      appendSubtree('');
    } else {
      allRows.sort(compareRows);
      allRows.forEach((row) => fragment.appendChild(row));
    }

    pinnedBottom.forEach((row) => fragment.appendChild(row));
    tbody.appendChild(fragment);
  }

  /**
   * Находит целевую таблицу по CSS-селектору триггера или внутри ближайшей секции.
   *
   * @param {HTMLElement} trigger
   * @param {string} attrName
   * @return {HTMLTableElement|null}
   */
  function resolveTargetTable(trigger, attrName) {
    const selector = trigger.getAttribute(attrName);
    if (selector && selector !== 'true') {
      return document.querySelector(selector);
    }
    const wrapper = trigger.closest('.b11-card, section, .page-main, body');
    return wrapper ? wrapper.querySelector('table') : null;
  }

  Drupal.behaviors.base11TableInteractive = {
    attach(context) {
      // 1. Инициализация древовидных таблиц
      once('base11-tree-table', 'table[data-b11-tree-table]', context).forEach((table) => {
        const savedExpanded = loadExpandedIds(table);
        table.querySelectorAll('tbody tr[data-row-id]').forEach((row) => {
          const isExpanded = row.classList.contains('is-expanded') || savedExpanded.has(row.dataset.rowId);
          updateRowToggleUi(row, isExpanded);
        });
        syncTreeVisibility(table);

        table.addEventListener('click', (event) => {
          const toggle = event.target.closest('[data-b11-row-toggle]');
          if (!toggle) return;
          const row = toggle.closest('tr[data-row-id]');
          if (!row) return;

          event.preventDefault();
          const nextState = !row.classList.contains('is-expanded');
          updateRowToggleUi(row, nextState);
          saveExpandedIds(table);
          syncTreeVisibility(table);
        });
      });

      // 2. Кнопки «Развернуть всё» и «Свернуть всё»
      once('base11-tree-expand-all', '[data-b11-tree-expand-all]', context).forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const table = resolveTargetTable(btn, 'data-b11-tree-expand-all');
          if (!table) return;
          table.querySelectorAll('tbody tr[data-row-id]').forEach((row) => {
            if (row.querySelector('[data-b11-row-toggle]')) {
              updateRowToggleUi(row, true);
            }
          });
          saveExpandedIds(table);
          syncTreeVisibility(table);
        });
      });

      once('base11-tree-collapse-all', '[data-b11-tree-collapse-all]', context).forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const table = resolveTargetTable(btn, 'data-b11-tree-collapse-all');
          if (!table) return;
          table.querySelectorAll('tbody tr[data-row-id]').forEach((row) => {
            updateRowToggleUi(row, false);
          });
          saveExpandedIds(table);
          syncTreeVisibility(table);
        });
      });

      // 3. Живой поиск по таблице
      once('base11-table-search', '[data-b11-table-search]', context).forEach((input) => {
        let debounceTimer = null;
        const applySearch = () => {
          const table = resolveTargetTable(input, 'data-b11-table-search');
          if (!table) return;
          if (table.hasAttribute('data-b11-tree-table')) {
            table.dataset.b11SearchQuery = input.value;
            syncTreeVisibility(table);
          } else {
            filterFlatTable(table, input.value);
          }
        };

        input.addEventListener('input', () => {
          window.clearTimeout(debounceTimer);
          debounceTimer = window.setTimeout(applySearch, 120);
        });

        input.addEventListener('search', applySearch);
      });

      // 4. Клиентская сортировка по заголовкам th[data-sort]
      once('base11-table-sort', 'th[data-sort]', context).forEach((th) => {
        th.setAttribute('role', 'button');
        th.setAttribute('tabindex', '0');

        const handleSort = () => {
          const table = th.closest('table');
          if (!table) return;
          const headers = Array.from(th.parentNode.children);
          const colIndex = headers.indexOf(th);
          const sortType = th.getAttribute('data-sort') || 'text';
          const currentDir = th.getAttribute('data-sort-dir');
          const nextDir = currentDir === 'asc' ? 'desc' : 'asc';

          headers.forEach((cell) => {
            if (cell !== th) {
              cell.removeAttribute('data-sort-dir');
            }
          });
          th.setAttribute('data-sort-dir', nextDir);
          sortTable(table, colIndex, sortType, nextDir);
        };

        th.addEventListener('click', handleSort);
        th.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSort();
          }
        });
      });
    },
  };
})(Drupal, once);
