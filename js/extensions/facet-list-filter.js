/**
 * @file
 * Живой поиск и фильтрация элементов списка внутри длинных блоков Facets.
 */
((Drupal, once) => {
  'use strict';

  Drupal.behaviors.facetExposedListFilter = {
    attach(context) {
      once('facet-list-filter-once', 'fieldset.facet-list-filter', context).forEach((wrapper) => {
        const list = wrapper.querySelector('.form-checkboxes');
        if (!list) {
          return;
        }

        // 1. Создаём поле быстрого поиска (type="search" даёт встроенную кнопку очистки)
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'facet-list-filter-search-wrapper';

        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.autocomplete = 'off';
        searchInput.className = 'facet-list-filter-search-input';
        searchInput.placeholder = Drupal.t('Search in list...');
        searchInput.setAttribute('aria-label', Drupal.t('Search in list'));

        // Блокируем всплытие событий к обработчикам авто-отправки Views AJAX
        const blockViewsAjax = (e) => {
          e.stopPropagation();
          if (e.type === 'keydown' && e.key === 'Enter') {
            e.preventDefault();
          }
        };

        searchInput.addEventListener('change', blockViewsAjax);
        searchInput.addEventListener('keydown', blockViewsAjax);
        searchInput.addEventListener('keyup', blockViewsAjax);

        // 2. Живая фильтрация элементов списка
        const applyFilter = (e) => {
          e.stopPropagation();

          const query = searchInput.value.trim().toLowerCase();
          list.querySelectorAll('.form-type-checkbox').forEach((item) => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? '' : 'none';
          });
        };

        searchInput.addEventListener('input', applyFilter);
        searchInput.addEventListener('search', applyFilter);

        inputWrapper.appendChild(searchInput);
        list.parentNode.insertBefore(inputWrapper, list);
      });
    },
  };
})(Drupal, once);
