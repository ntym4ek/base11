# Base11 (v2.2) — Базовая тема для проектов на Drupal 11.4+

`base11` — автономная каркасная тема (`base theme: false`) для лендингов, корпоративных сайтов, интернет-магазинов (Drupal Commerce 3) и внутренних дашбордов/порталов отчётности.

Вся проектная стилизация выносится в дочернюю тему (`themes/project`) через CSS-переменные (Design Tokens), каскадные слои `@layer` и опциональные библиотеки.

---

## 1. Модульный Sass и публичный API

В `base11` используется современный синтаксис Sass (`@use` / `@forward`, без `@import`):

- **Точка входа базовых стилей (подключается один раз в `project.scss`):**
  ```scss
  // Рекомендуемый режим (CSS Grid без устаревшей Flexbox-сетки .row / .col-*):
  @use "../../base11/css/supplies/styles" with ($enable-flex-grid: false);

  // Режим обратной совместимости (по умолчанию $enable-flex-grid: true):
  // @use "../../base11/css/supplies/styles";
  // При нестандартном числе колонок legacy-сетки (например, 10):
  // @use "../../base11/css/supplies/styles" with ($grid-columns: 10);
  ```
- **Публичный API для дочерних паршалов (0 байт дублированного CSS):**
  ```scss
  @use "../../base11/css/supplies/api" as *;
  ```
  Подключает переменные брейкпоинтов (`$smart-only`, `$pad`, `$tablet`, `$laptop`, `$desktop`, `$wide`, а также `$pad-only`, `$tablet-only`, `$laptop-only`, `$desktop-only`), карту `$grid-breakpoints` и миксины (`grid`, `grid-subgrid`, `row`, `col`, `responsive-prop`, `font-size`, `gradient`, `button-reset` и др.).
- **Опциональные стили для WYSIWYG-редактора CKEditor 5:**
  ```scss
  @use "../../base11/css/supplies/b11-ckeditor5";
  ```

---

## 2. Каскадные слои (`@layer`)

Порядок приоритета слоёв объявлен в `css/supplies/_b11-layers.scss` (от наименьшего к наибольшему):

```css
@layer b11.reset, b11.tokens, b11.base, b11.layout, b11.elements, b11.components, b11.utilities;
```

- Стили подтемы вне `@layer` всегда имеют приоритет выше любого базового слоя без необходимости в `!important` или громоздких селекторах.
- **Важно:** глобальные стили HTML-тегов в подтеме (`html`, `body`, `h1..h6`, `a` в `_base.scss`) следует оборачивать в `@layer b11.base { ... }`, а глобальные правила `<details>` — в `@layer b11.elements { ... }`, чтобы они не перекрывали компоненты `.button`, `.pager`, `.menu`, `.tabs`, `.b11-badge`.
- Все standalone-расширения (`css/extensions/*.scss`) и SDC-компоненты (`components/*/*.scss`) первыми строками подключают `_b11-layers.scss`, гарантируя стабильный порядок слоёв независимо от порядка загрузки CSS-файлов.

---

## 3. Дизайн-токены и плотность интерфейсов

Основные переменные определены в `css/supplies/_b11-tokens.scss` и переопределяются в `_tokens.scss` подтемы:

- **Шрифты и типографика:** `--font-family-base`, `--font-family-heading`, `--font-family-mono`, `--font-size-{xs,sm,base,lg,h1..h6}`, `--line-height-{sm,base,lg}`. Для редакционного контента предусмотрен класс `.prose`.
- **Цвета и статусные палитры:** `--brand-{primary,info,success,warning,danger}`, `--page-bg`, `--surface-{card,subtle,hover}`, `--text-{color,muted,light}`, `--border-color`, `--border-color-light`, `--on-{primary,info,success,warning,danger}`, `--status-{info,success,warning,danger}-{bg,border,text}`.
- **Контролы и формы:** `--control-height-{sm,md,lg}`, `--control-font-size-{sm,md,lg}`, `--control-radius-{sm,md,lg}`, `--btn-*`, `--input-*`, `--label-*`.
- **Сетка, геометрия и ритм:** `--page-max-width`, `--page-gap-x`, `--grid-gap-x`, `--grid-gap-y`, `--block-gap-y`, `--sidebar-width`, `--stack-gap`, `--cluster-gap`.
- **Таблицы и отступы:** `--table-cell-padding-x`, `--table-cell-padding-y`, `--table-head-padding-y`.
- **Модалки и слои:** `--modal-*`, `--z-{dropdown,sticky,fixed,modal-backdrop,modal,toast}`, `--shadow-{sm,md,lg}`, `--card-shadow`, `--dropdown-shadow`.
- **AJAX-индикаторы:** `--ajax-overlay-{bg,blur}`, `--ajax-spinner-{color,track,size,stroke}`, `--ajax-delay`, `--ajax-fullscreen-{size,bg,blur,border,radius,shadow}`.
- **Графики и аналитика:** `--chart-{plan,fact,deal,positive,negative,warning}`, `--chart-series-1..8`, `--chart-{grid-color,axis-color,tooltip-bg,tooltip-border}`, `--chart-height-{sm,md,lg}`. Для асинхронной загрузки виджетов в `_b11-helper.scss` предусмотрен класс `.b11-skeleton` (`--text`, `--title`, `--card`, `--chart`).

### Компактный режим (`data-density="compact"`)
Для дашбордов, отчётных таблиц и плотных форм фильтров достаточно добавить атрибут `data-density="compact"` на `<body>` или отдельный контейнер — автоматически уменьшатся `--control-height-*`, `--sidebar-width`, `--stack-gap`, `--cluster-gap`, отступы кнопок, полей, таблиц и сетки.

---

## 4. Сетка, таблицы и адаптивные брейкпоинты

- **Drupal Breakpoints (`base11.breakpoints.yml`):** группы `base11.sm` (0px), `base11.pd` (768px), `base11.tb` (1024px), `base11.lp` (1366px), `base11.dt` (1600px), `base11.wd` (1920px) — доступны для Responsive Image Styles.
- **Всегда активные контейнеры и видимость (`_b11-grid.scss`, работают при любом `$enable-flex-grid`):**
  - `.container`, `.container-fluid` — центрирование и боковые поля `--page-gap-x`.
  - `.show-{sm,pd,tb,lp,dt,wd}` / `.hide-{sm,pd,tb,lp,dt,wd}` и точные диапазоны `*-only` (`sm-only`, `pd-only`, `tb-only`, `lp-only`, `dt-only`). *Примечание:* `.show-*` задают `display: block !important;`, поэтому для показа/скрытия `flex`/`grid`-контейнеров управляйте `display` напрямую в SCSS компонента либо оборачивайте внутренний `flex`/`grid` во внешний блок.
- **Система раскладки на CSS Grid (`_b11-grid.scss`, `_b11-grid-mixins.scss`):**
  - `.grid` (`.grid--2`, `.grid--3`, `.grid--4`, `.grid--flush`, `.grid--tight`, `.grid--center`, `.grid--start`, локальная переменная `--grid-cols`) — управляемая сетка колонок `repeat(var(--grid-cols), minmax(0, 1fr))` с двухосевым `gap: var(--grid-gap-y) var(--grid-gap-x)`; в SCSS доступен миксин `@include grid($cols, $gap-x, $gap-y)`.
  - `.grid-auto` (`.grid-auto--sm`, `.grid-auto--lg`, `.grid-auto--fill`, кастом `--grid-min`) — авто-адаптивная сетка CSS Grid (`auto-fit` по умолчанию, `auto-fill` через `--fill`) без ручного перечисления брейкпоинтов.
  - `.grid-sidebar` (`.grid-sidebar--end`, `.grid-sidebar--both`, `.grid-sidebar--start`, `.grid-sidebar--pd`, `.grid-sidebar--lp`, переменная `--sidebar-width`) — раскладка «фиксированный сайдбар + гибкий контент `minmax(0, 1fr)`» с автопереходом в 1 колонку на мобильных (по умолчанию от `$tablet`, опционально от `$pad` или `$laptop`).
  - `.grid-subgrid` (`.grid-subgrid--2`..`--5`, переменные `--subgrid-rows`, `--subgrid-gap`) и миксин `@include grid-subgrid($rows, $row-gap)` — выравнивание внутренних секций карточек в ряду по строкам родительской сетки (CSS Subgrid).
  - `.stack` (`.stack--xs`, `--sm`, `--md`, `--lg`, `--section`) — вертикальный ритм на базе `flex-direction: column` и `gap: var(--stack-gap)`.
  - `.cluster` (`.cluster--sm`, `--lg`, `--between`, `--center`, `--end`, `--start`, `--nowrap`) — горизонтальные переносящиеся группы элементов с `gap: var(--cluster-gap)`.
  - `.cq-container` — задаёт `container-type: inline-size` для адаптации вложенных блоков по ширине родителя.
- **Отключаемая legacy Flexbox-сетка (`.row` / `.col-*`):**
  - Управляется флагом `$enable-flex-grid: true !default;` в `_b11-grid-variables.scss`. Для отключения в проекте используйте `@use "../../base11/css/supplies/styles" with ($enable-flex-grid: false);`.
- **Таблицы (`_b11-tables.scss` и `_b11-helper.scss`):**
  - `.table-responsive` — контейнер горизонтальной прокрутки для широких таблиц.
  - `.table--striped`, `.table--hover`, `.table--sticky-head`, `.table--compact`.
  - `.is-numeric` / `.tabular-nums` / `.font-mono` — табличные цифры и моноширинные значения (цены, суммы, артикулы).

---

## 5. Библиотеки темы (`base11.libraries.yml`)

Подключаются в `base11.info.yml` глобально:
- `base11/messages` — тосты/встроенные системные сообщения (переопределяется токенами `--status-*`).
- `base11/ajax-spinner` — встроенный спиннер кнопок для AJAX, submit-форм и ссылок с задержкой `120ms`.
- `base11/file-upload` (через `file/drupal.file` + `Base11Hooks::formAlter()`).
- `base11/media-library` (через `media_library/widget`, `media_library/ui`, настраивается токенами `--ml-*`).
- `base11/password-toggle` (автоматически для `input[type="password"]` в `Base11Hooks::preprocessInput()`).

Подключаются по требованию в `.info.yml` подтемы:
- `base11/font-montserrat`, `base11/helper`, `base11/back-to-top`, `base11/menu-mobile`, `base11/swipe-events`, `base11/click-to-copy`, `base11/tabs-js`, `base11/swiper-thumbs`, `base11/lightbox`, `base11/facet-extension`, `base11/facet-list-filter`, `base11/layout-dashboard`, `base11/layout-kiosk`, `base11/filter-bar`, `base11/table-interactive`, `base11/echarts`, `base11/native-dialog`.

---

## 6. SDC-компоненты Drupal 11 (`components/`)

CSS каждого компонента подгружается ядром только при рендере:

1. **`base11:badge`** (`text`, `variant`: `neutral|primary|info|success|warning|danger`, `size`: `sm|md`, `pill`):
   ```twig
   {% include 'base11:badge' with { text: 'Оплачен', variant: 'success', size: 'sm' } only %}
   ```
2. **`base11:stat-card`** (`label`, `value`, `delta`, `trend`: `up|down|neutral`, `caption`; слот `icon`):
   ```twig
   {% include 'base11:stat-card' with { label: 'Заказы', value: '1 284', delta: '+14%', trend: 'up' } only %}
   ```
3. **`base11:card`** (`variant`: `default|bordered|flat`, `interactive`, `responsive`; слоты `media`, `header`, `body`, `footer`):
   ```twig
   {% embed 'base11:card' with { interactive: true, responsive: true } only %}
     {% block header %}<h3>{{ label }}</h3>{% endblock %}
     {% block body %}{{ content.body }}{% endblock %}
   {% endembed %}
   ```
4. **`base11:empty-state`** (`title`, `description`, `heading_level`: `h1|h2|h3`, `variant`: `card|plain`, `full_height`; слоты `icon`, `badge`, `actions`; кастомизация цветами через `--empty-icon-bg`, `--empty-icon-color`, `--empty-icon-size`, `--empty-max-width`).
5. **`base11:chart`** (`chart_id`, `title`, `subtitle`, `badge_text`, `badge_variant`, `height`: `sm|md|lg`, `config`, `endpoint`, `exportable`, `loading`; слоты `actions`, `note`) — карточка графика Apache ECharts с ленивой подгрузкой, skeleton-заглушкой и кнопкой экспорта в PNG.

---

## 7. Icon API (`base11.icons.yml`) и автоподмена в подтеме

В `images/icons/` хранятся 35 UI-иконок (`arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `chevron-down`, `chevron-left`, `chevron-right`, `chevrons-up`, `external-link`, `close`, `menu`, `sidebar`, `maximize`, `tv`, `bar-chart`, `refresh`, `search`, `filter`, `plus`, `minus`, `copy`, `link`, `download`, `check`, `info`, `warning`, `error`, `cart`, `user`, `calendar`, `inbox`, `lock`, `play`, `star`, `star-filled`).

Вызов в любом шаблоне:
```twig
{{ icon('base11', 'cart', { size: 22, class: 'header-cart__svg' }) }}
```

### Переопределение иконок в подтеме и работа на Windows
Если дочерняя тема объявляет собственный `<theme>.icons.yml` (пак с именем темы, например `project:`, с параметрами `size` и `class`), то при наличии одноимённого SVG-файла (например `images/icons/arrow-up.svg`) `Base11Hooks::elementInfoAlter()` + `preRenderIconOverride()` автоматически подменит вызов `icon('base11', 'arrow-up')` на иконку из активной подтемы.

В дополнение к этому `Base11Hooks::preRenderIconWindowsFallback()` прозрачно обходит ограничение ядра Drupal 11.4 в `IconFinder::getFileContents()` при работе с путями Windows (`C:\...` на OSPanel6), не затрагивая штатный рендер ядра на Linux.
