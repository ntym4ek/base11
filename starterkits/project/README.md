# Стартеркит дочерней темы Project для Base11 (v2.0)

Быстрый старт новой темы проекта на Drupal 11.4+.

## Установка и настройка

1. Скопируйте каталог `themes/base11/starterkits/project` в `themes/project` (или под машинным именем вашей темы).
2. Переименуйте `project.info.yml.starterkit` → `project.info.yml` (при смене имени темы также обновите ключи в `*.info.yml`, `*.libraries.yml` и namespace в `src/Hook/`).
3. Переименуйте `css/project.scss.starterkit` → `css/project.scss`.
   - Если проекту нужно нестандартное число колонок сетки (например, 10 вместо 12), замените в `project.scss` строку подключения на:
     ```scss
     @use "../../base11/css/supplies/styles" with ($grid-columns: 10);
     ```
4. При необходимости подключите нужные библиотеки `base11/*` в `project.info.yml` и настройте брендовые переменные в `css/_tokens.scss`.
5. Скомпилируйте `css/project.scss` (и при необходимости `css/ckeditor5.scss`) в CSS:
   ```cmd
   sass css/project.scss:css/project.css --embed-source-map
   sass css/ckeditor5.scss:css/ckeditor5.css --embed-source-map
   ```
6. Активируйте тему по умолчанию в Drupal и сбросьте кэши (`drush cr`).

Подробная документация по архитектуре, слоям CSS, токенам, SDC-компонентам и Icon API находится в `themes/base11/README.md`.
