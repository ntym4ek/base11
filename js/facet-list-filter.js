/**
 * @file
 * Живой поиск/фильтрация элементов списка в блоке Facet.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.facetExposedListFilter = {
    attach: function (context) {
      // Ищем списки фасетов (подойдет для List of links, Checkboxes и т.д.)
      const facetWrappers = once('facet-list-filter-once', 'fieldset.facet-list-filter', context);

      facetWrappers.forEach(function (wrapper) {
        const list = wrapper.querySelector('.form-checkboxes');
        if (!list) {
          return;
        }

        // 1. Создаем поле ввода для фильтра
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'facet-list-filter-search-wrapper';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.autocomplete = 'off';
        searchInput.className = 'form-control facet-list-filter-search-input';
        searchInput.placeholder = 'Поиск по списку...';
        searchInput.setAttribute('aria-label', 'поиск по списку');

        // Блокируем передачу событий в AJAX-обработчики Views
        const blockViewsAjax = function (e) {
          e.stopPropagation();
          if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
          }
        };

        searchInput.addEventListener('change', blockViewsAjax);
        searchInput.addEventListener('keydown', blockViewsAjax);
        searchInput.addEventListener('keyup', blockViewsAjax);

        // 2. Обработчик фильтрации
        searchInput.addEventListener('input', function (e) {
          e.stopPropagation(); // Не даем событию input всплывать к форме Views

          const query = searchInput.value.trim().toLowerCase();
          const items = list.querySelectorAll('.form-type-checkbox');

          items.forEach(function (item) {
            // Ищем текст внутри ссылки или метки чекбокса
            const text = item.textContent.toLowerCase();

            // Если элемент уже выбран/активен, можно не скрывать его, либо фильтровать на общих основаниях:
            if (text.includes(query)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        });

        inputWrapper.appendChild(searchInput);
        list.parentNode.insertBefore(inputWrapper, list);
      });
    }
  };
})(Drupal, once);
