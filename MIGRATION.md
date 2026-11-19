# Base11 — Журнал миграции (v1.3.6 → 2.0)

Этот документ фиксирует **все изменения базовой темы `base11`**, влияющие на дочерние темы `project` (`ff.local`, `jp.local`, `lubr.local`). Каждая запись содержит точный regex для автоматизированного поиска устаревших конструкций в подтемах.

Базовый коммит до начала модернизации: тег `v1.3.6` (`b326037`).

---

## Этап 1 — Стабилизация, исправление багов, вынос KCCC-механизма, оптимизация Montserrat

### [CHG-01] Переименование `--shadow-base` → `--shadow-md`
- **Этап:** 1 | **Тип:** BREAKING
- **Было:** `--shadow-base`
- **Стало:** `--shadow-md` (шкала теней приведена к `-sm` / `-md` / `-lg`; `--shadow-base-color` не изменён)
- **Как найти в подтеме (regex):** `--shadow-base(?![a-zA-Z0-9_-])`
- **Что сделать в `project`:** заменить все вхождения `--shadow-base` на `--shadow-md` и перекомпилировать SCSS.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-02] Добавление токена `--font-size-xs`
- **Этап:** 1 | **Тип:** ADDED
- **Было:** микро-размер шрифта не был определён в `_b11-tokens.scss` (в подтемах и расширениях использовались `.65rem`, `.7rem`, `.75rem` или локальный `--font-size-xs`).
- **Стало:** в `:root` добавлен `--font-size-xs: .75rem;` и применён в `_b11-buttons.scss`, `click-to-copy.scss`, `facet-extension.scss`.
- **Как найти в подтеме (regex):** `--font-size-xs\s*:`
- **Что сделать в `project`:** удалить дублирующее объявление `--font-size-xs: .75rem;` из `css/_tokens.scss`, если оно совпадает с базовым (`jp.local`).
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-03] Удаление `.button--xs` и `--btn-font-size-xs`
- **Этап:** 1 | **Тип:** REMOVED
- **Было:** в `_b11-buttons.scss` присутствовал модификатор `.button--xs` и неопределённый `--btn-font-size-xs`.
- **Стало:** удалено; поддерживаются только размеры `-sm`, `-md` (по умолчанию), `-lg`.
- **Как найти в подтеме (regex):** `button--xs|--btn-font-size-xs`
- **Что сделать в `project`:** заменить на `button--sm`, если встретится.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-04] Исправление `backdrop-filter` в диалогах
- **Этап:** 1 | **Тип:** FIXED
- **Было:** `backdrop-filter: var(--modal-backdrop-blur);` (невалидный CSS при `--modal-backdrop-blur: 4px`).
- **Стало:** `backdrop-filter: blur(var(--modal-backdrop-blur));` в `_b11-dialog.scss`.
- **Как найти в подтеме (regex):** `--modal-backdrop-blur`
- **Что сделать в `project`:** убедиться, что токен `--modal-backdrop-blur` при переопределении задаётся как длина (например, `4px`), а не `blur(...)`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-05] Замена `overflow: hidden` на `overflow-x: clip` в `.page-wrapper`
- **Этап:** 1 | **Тип:** FIXED
- **Было:** `.page-wrapper { overflow: hidden; }` (блокировал `position: sticky`).
- **Стало:** `.page-wrapper { overflow-x: clip; }` в `_b11-layout.scss`.
- **Как найти в подтеме (regex):** `\.page-wrapper`
- **Что сделать в `project`:** правки не требуются, проверить визуально работу `sticky`-элементов при наличии.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-06] Исправление токена скругления в `messages.scss`
- **Этап:** 1 | **Тип:** FIXED
- **Было:** `border-radius: var(--control-radius, .5rem);` (несуществующий токен) и лишние fallback-значения.
- **Стало:** `border-radius: var(--control-radius-md);`, удалены лишние fallback.
- **Как найти в подтеме (regex):** `var\(--control-radius\b(?![-])`
- **Что сделать в `project`:** при обнаружении заменить на `--control-radius-sm` / `-md` / `-lg`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-07] Динамический цвет активной радиокнопки
- **Этап:** 1 | **Тип:** FIXED
- **Было:** жёстко зашитый синий цвет `#213A6E` в inline SVG data-URI у `.form-type-radio input:checked`.
- **Стало:** `background-image: radial-gradient(circle, var(--brand-primary) 45%, transparent 50%);`.
- **Как найти в подтеме (regex):** `form-type-radio`
- **Что сделать в `project`:** правки не требуются; радиокнопки автоматически берут `--brand-primary`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-08] Исправление активного состояния и разметки пагинации
- **Этап:** 1 | **Тип:** FIXED
- **Было:** `_b11-drupal-core.scss` стилизовал `.pager__item.is-active span`, тогда как `pager.html.twig` оборачивал активную страницу в `<a>`; на `<nav>` висел лишний `role="navigation"`.
- **Стало:** стилизуются `.pager__item.is-active a, .pager__item.is-active span`; в `pager.html.twig` добавлен `aria-current="page"` на активную ссылку, удалён `role="navigation"`.
- **Как найти в подтеме (regex):** `\.pager__item`
- **Что сделать в `project`:** правки не требуются (если пагинация не переопределена вручную).
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-09] Консолидация мобильных размеров заголовков
- **Этап:** 1 | **Тип:** FIXED
- **Было:** конфликтное переопределение `--font-size-h2` и `--font-size-h3` в `@media #{$smart-only}` в двух местах (`_b11-tokens.scss` и `_b11-base.scss`).
- **Стало:** единый блок `@media #{$smart-only}` в `_b11-tokens.scss` (`h1: 2rem`, `h2: 1.5rem`, `h3: 1.222rem`), дубль в `_b11-base.scss` удалён.
- **Как найти в подтеме (regex):** `--font-size-h[1-6]`
- **Что сделать в `project`:** при переопределении в подтемах перепроверить, что значения соответствуют дизайн-макету.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-10] Удаление повреждающего `.visually-hidden { inset: 0; }`
- **Этап:** 1 | **Тип:** FIXED
- **Было:** в `_b11-base.scss` присутствовало правило `.visually-hidden { inset: 0; }`, конфликтовавшее со скрытием ядра.
- **Стало:** правило удалено.
- **Как найти в подтеме (regex):** `visually-hidden\s*\{\s*inset`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-11] Добавление `@keyframes fadeInOverlay` в `facet-extension.scss`
- **Этап:** 1 | **Тип:** FIXED
- **Было:** `animation: fadeInOverlay 150ms ease forwards;` ссылалась на отсутствующий `@keyframes`.
- **Стало:** `@keyframes fadeInOverlay` добавлен и `facet-extension.css` перекомпилирован.
- **Как найти в подтеме (regex):** `fadeInOverlay`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-12] Сохранение контейнера `[data-drupal-messages]` в DOM
- **Этап:** 1 | **Тип:** FIXED
- **Было:** `messages.js` удалял `[data-drupal-messages]` после закрытия последнего сообщения, ломая последующие AJAX-уведомления.
- **Стало:** удаляется только элемент `.messages`, контейнер `[data-drupal-messages]` остаётся в DOM.
- **Как найти в подтеме (regex):** `data-drupal-messages`
- **Что сделать в `project`:** правки не требуются (в `jp.local` уже используется свой `js/messages.js`).
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-13] Доступность кнопки показа пароля с клавиатуры
- **Этап:** 1 | **Тип:** FIXED
- **Было:** `password-toggle.js` выставлял `button.tabIndex = -1`, делая кнопку недоступной с клавиатуры.
- **Стало:** `tabIndex = -1` удалён.
- **Как найти в подтеме (regex):** `password-toggle`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-14] Пассивные touch-обработчики и очистка `swipe-events.js`
- **Этап:** 1 | **Тип:** FIXED
- **Было:** непассивные `touchstart`/`touchmove`/`touchend` и полифилл `CustomEvent` для IE.
- **Стало:** добавлен `{ passive: true }`, удалён IE-полифилл.
- **Как найти в подтеме (regex):** `swipe-events`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-15] Безопасная обработка ошибок в `base11_preprocess_status_messages()`
- **Этап:** 1 | **Тип:** FIXED
- **Было:** любой `POST`-запрос подавлял все сообщения об ошибках и подменял захардкоженной русской строкой.
- **Стало:** сворачивается только сводка `inline_form_errors` (`str_contains($message_str, 'href="#')`); системные ошибки (оплата, корзина, права и др.) сохраняются; текст переводится через `t()`.
- **Как найти в подтеме (regex):** `preprocess_status_messages`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-16] Очистка шаблонов от фантомных библиотек и Twig-депрекаций
- **Этап:** 1 | **Тип:** REMOVED / FIXED
- **Было:**
  - 7 несуществующих `attach_library('base11/node|indented|search-results|file|progress')` в шаблонах `base11` и скопированные `attach_library('base11/node')` в дочерних шаблонах `node--*`;
  - `node.html.twig` использовал `not page` вместо `view_mode != 'full'`;
  - присутствовал проектный `templates/form/input-dropdown-filter.html.twig` и шаблоны `swiper-formatter` с deprecated `{% apply spaceless %}`.
- **Стало:** фантомные `attach_library` удалены в `base11` и дочерних темах (`ff.local` — 5 шаблонов `node--*`, `lubr.local` — 3 шаблона `node--*`); `node.html.twig` синхронизирован с ядром; `input-dropdown-filter.html.twig` удалён из `base11`; теги `{% apply spaceless %}` / `{% endapply %}` удалены в `jp.local` (`input-dropdown-filter.html.twig` и 2 шаблона `swiper-formatter`) и `lubr.local` (`swiper-formatter--product-images.html.twig`).
- **Как найти в подтеме (regex):** `attach_library\('base11/(node|indented|search-results|file|progress)'\)|apply spaceless`
- **Что сделать в `project`:** удалить фантомные `attach_library('base11/node')` и устаревшие `{% apply spaceless %}` / `{% endapply %}`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-17] Актуализация `theme-settings.php` и добавление `config/install` + `config/schema`
- **Этап:** 1 | **Тип:** ADDED / FIXED
- **Было:** Drupal 7 свойства `#collapsible`/`#collapsed` в `theme-settings.php`, отсутствие `t()` и схемы конфигурации.
- **Стало:** `#type => 'details'`, `#type => 'number'` для ширины, обёртка в `t()`, добавлены `config/install/base11.settings.yml` и `config/schema/base11.schema.yml`.
- **Как найти в подтеме (regex):** `nav-mobile-hide-width`
- **Что сделать в `project`:** правки не требуются (если в подтеме не использовался ошибочный ключ `nav-mobile-hide-width`).
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-18] Оптимизация `base11.info.yml`, `base11.libraries.yml` и шрифта Montserrat
- **Этап:** 1 | **Тип:** BREAKING
- **Было:**
  - `base11/font-montserrat` грузился глобально (23 `.ttf`, 7.12 МБ);
  - `base11/file-upload` и `base11/password-toggle` грузились глобально на всех страницах;
  - у библиотек стоял `version: VERSION` (подставлялась версия ядра).
- **Стало:**
  - `base11/font-montserrat` переведён на Variable WOFF2 (~418 КБ суммарно) и убран из глобальных библиотек `base11.info.yml` — подключается опционально подтемой;
  - `base11/file-upload` подключается через `libraries-extend: file/drupal.file` (и форму/шаблон), `base11/password-toggle` — динамически через `base11_preprocess_input()`;
  - `version: VERSION` удалён из `base11.libraries.yml`; версия темы в `base11.info.yml` — `2.0.0-alpha1`.
- **Как найти в подтеме (regex):** `base11/font-montserrat:\s*false|-\s*base11/password-toggle\b|-\s*base11/file-upload\b`
- **Что сделать в `project`:**
  - Если проект использует **свой** шрифт (`ff.local`, `jp.local`) — удалить `base11/font-montserrat: false` из `libraries-override`.
  - Если проект использует **Montserrat из base11** (`lubr.local`) — явно добавить `- base11/font-montserrat` в `libraries:` файла `project.info.yml`.
  - Удалить избыточное явное подключение `- base11/password-toggle` из `libraries:` в `project.info.yml`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-19] Вынос устаревшего KCCC-механизма и модернизация `page.html.twig`
- **Этап:** 1 | **Тип:** BREAKING / REMOVED
- **Было:**
  - `base11_preprocess_page()` формировал `site.name`, `site.logo.standart`, `site.logo.transparent`, `site.copyright`, `is_header_on`, авто-баннер `public://images/page-banners/` и создавал `ImageStyle` на лету;
  - существовали `css/extensions/layout-kccc.scss` + `layout-kccc.css`, библиотека `base11/layout-kccc`, папка `images/logo/`;
  - `templates/layout/page.html.twig` и `starterkits/project/templates/layout/page.html.twig` содержали KCCC-разметку и несуществующие классы `hide-lg`/`hide-xs`/`show-lg`/`middle-xs`.
- **Стало:**
  - `base11_preprocess_page()`, `base11/layout-kccc`, `css/extensions/layout-kccc.*`, `images/logo/` удалены из `base11`;
  - `templates/layout/page.html.twig` и `starterkits/project/templates/layout/page.html.twig` переписаны на чистую нейтральную разметку Drupal 11.4 с `<a id="main-content" tabindex="-1"></a>`, `<button>` для меню/наверх, всеми объявленными регионами и Twig-блоками `page_main` / `page_content`.
- **Как найти в подтеме (regex):** `layout-kccc|base11/images/logo|is_header_on|\bbanner\.|site\.logo|site\.copyright`
- **Что сделать в `project`:**
  - Убедиться, что все переменные, используемые в собственном `page.html.twig` проекта (`is_header_on`, `banner`, `site.logo.*`), задаются в `project_preprocess_page()` самого проекта (`ff.local`: задать `$vars['is_header_on'] = true;`; `lubr.local`: задать `$vars['is_header_on'] = true;` и перенести поиск `page-banners` без автосоздания `ImageStyle` на лету).
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-20] Поддержка навигационных кнопок-ссылок в `base11/ajax-spinner`
- **Этап:** 1 | **Тип:** ADDED
- **Было:** `js/extensions/ajax-spinner.js` отслеживал только событие `submit` на `<form>`, а клики по навигационным ссылкам `<a href="..." class="button">` не отображали спиннер.
- **Стало:** добавлен делегированный обработчик клика по навигационным кнопкам-ссылкам `a.button[href], a.btn[href]` (включая кнопки внутри модальных окон) с задержкой показа `120 мс` (`LINK_SPINNER_DELAY`), защитой от двойного клика, исключением AJAX/лайтбоксов/`target="_blank"`/якорей/`.no-spinner`/`.button--link` и сбросом на `pageshow`; в `ajax-spinner.scss` добавлено скрытие вложенных тегов внутри активной кнопки.
- **Как найти в подтеме (regex):** `ajax-spinner`
- **Что сделать в `project`:** правки не требуются, работает автоматически (для отключения на отдельной кнопке можно добавить класс `.no-spinner`).
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`


---

## Этап 2 — Архитектура Drupal 11.4 и CSS-фундамент

### [CHG-21] Переход SCSS-архитектуры на `@use` / `@forward` и выделение `_api.scss`
- **Этап:** 2 | **Тип:** BREAKING
- **Было:** подключение стилей и переменных через устаревший `@import` (`styles.scss`, `_b11-tokens.scss`, `facet-extension.scss`); настройки `$grid-columns` и миксины `_b11-grid.scss` невозможно было изолированно использовать без генерации лишнего CSS.
- **Стало:**
  - все файлы `base11` переведены на `@use` / `@forward` (0 предупреждений `DEPRECATION WARNING [import]`);
  - миксины сетки выделены в чистый Sass-паршал `css/supplies/_b11-grid-mixins.scss`;
  - создана единая точка импорта чистого API `css/supplies/_api.scss` (`@forward "b11-grid-variables"`, `"b11-mixins"`, `"b11-grid-mixins"`, 0 байт CSS);
  - `_styles.scss` пробрасывает `@forward "b11-grid-variables"` первой строкой для работы `@use "../../base11/css/supplies/styles" with ($grid-columns: N);`;
  - обновлён `starterkits/project/css/project.scss.starterkit`.
- **Как найти в подтеме (regex):** `^[ \t]*@import\s+["'](?!url\(|https?:)`
- **Что сделать в `project`:**
  - заменить все `@import` в `project.scss` (и других точках входа: `email.scss`, `ckeditor5.scss`) на `@use`; в `jp.local` использовать `@use "../../base11/css/supplies/styles" with ($grid-columns: 10);`;
  - в паршалах, использующих переменные брейкпоинтов или миксины `base11`, добавить в начало `@use "../../base11/css/supplies/api" as *;` (строго выше CSS `@import url(...)`);
  - при вызове локальных миксинов (например `padding-side()` / `padding-block()` в `jp.local`) подключить `@use "helper" as *;`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-22] Каскадные слои CSS (`@layer b11.*`)
- **Этап:** 2 | **Тип:** BREAKING / ADDED
- **Было:** плоский глобальный каскад без слоёв. Правила `base11` могли конкурировать с дочерней темой по порядку подключения и специфичности, а длинные селекторы требовали перебивания сложными цепочками.
- **Стало:**
  - создан `css/supplies/_b11-layers.scss` с порядком: `@layer b11.reset, b11.tokens, b11.base, b11.layout, b11.elements, b11.components, b11.utilities;`;
  - все стили `base11` распределены по соответствующим слоям;
  - стили дочерней темы (вне слоёв) по спецификации CSS Cascade имеют более высокий приоритет над слоями `base11` независимо от специфичности селектора.
- **Как найти в подтеме (regex):** `^(html|body|h[1-6]|a|details)\b[^:{]*\{`
- **Что сделать в `project`:**
  - **Критично:** неразвёрнутые (unlayered) глобальные селекторы тегов (`a { color: inherit; }`, `html`, `body`, `h1..h4` в `_base.scss` или `details { ... }` в `_file.scss`) перебьют слоёные компоненты `base11` (`.button`, `.pager`, `.breadcrumb`, `.horizontal-tabs`);
  - обернуть глобальные правила тегов в `_base.scss` в `@layer b11.base { ... }`, а переопределение `details` (например в `ff.local/_file.scss`) в `@layer b11.elements { ... }`, оставив классы компонентов (`.button`, `.button--default`, ...) вне слоёв.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-23] Замена `core/normalize` на `@layer b11.reset` и расширение `libraries-override`
- **Этап:** 2 | **Тип:** CHANGED
- **Было:** неслоёный `core/normalize` и базовые CSS-файлы ядра/модулей (`system/base` align/container-inline, `core/drupal.dropbutton`, `core/drupal.progress`, `field_group/element.horizontal_tabs`) загружались вне слоёв и обладали более высоким приоритетом, чем `@layer b11.*`.
- **Стало:**
  - `core/normalize` исключён из `libraries:` и отключён через `libraries-override: core/normalize: false`; вместо него добавлен компактный `css/supplies/_b11-reset.scss` в `@layer b11.reset`;
  - в `base11.info.yml` через `libraries-override` отключены конфликтующие неслоёные CSS: `system/base` (`align.module.css`, `container-inline.module.css` с сохранением `clearfix`/`hidden`/`js`), `core/drupal.dropbutton` (`dropbutton.css`), `core/drupal.progress` (`progress.module.css`), `field_group/element.horizontal_tabs` (`horizontal-tabs.css`); `core/drupal.checkbox` (JS) не затронут.
- **Как найти в подтеме (regex):** `-\s*core/normalize\b`
- **Что сделать в `project`:** правки в подтемах не требуются (если подтема не подключала `core/normalize` вручную).
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-24] Расширение дизайн-токенов и устранение `mixed-decls` в `_b11-tokens.scss`
- **Этап:** 2 | **Тип:** ADDED / FIXED
- **Было:**
  - отсутствовали токены `--font-family-mono`, `--surface-subtle`, `--surface-hover`, `--link-color`, `--link-hover-color`, контрастный текст `--on-*` и статусные палитры `--status-*`;
  - в `--btn-bg`/`--btn-border-color`/`--btn-bg-hover` и др. использовались хардкодные цвета `#f1f3f5`/`#d1d5db`/`#e5e7eb`/`#9ca3af`/`#6b7280`;
  - `@media #{$smart-only}` располагался внутри `:root { ... }`, порождая ~148 предупреждений Dart Sass `mixed-decls`.
- **Стало:**
  - добавлены токены: `--font-family-mono`, `--link-color`, `--link-hover-color`, `--surface-subtle`, `--surface-hover`, `--on-{primary,info,success,warning,danger}`, `--status-{info,success,warning,danger}-{bg,border,text}`;
  - цвета дефолтной нейтральной кнопки выражены через `--surface-subtle`, `--surface-hover`, `--border-color`, `--text-muted`;
  - `@media #{$smart-only}` вынесен вниз `_b11-tokens.scss` (0 предупреждений `mixed-decls`).
- **Как найти в подтеме (regex):** `--font-family-mono|--surface-subtle|--status-|--on-primary`
- **Что сделать в `project`:** при необходимости переопределить `--link-color`/`--on-*`/`--surface-*` в `_tokens.scss` и использовать новые токены при разработке компонентов.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-25] Фиксированный `html { font-size: 100%; }` и `text-wrap: balance` для заголовков
- **Этап:** 2 | **Тип:** BREAKING
- **Было:** `base11` переключал `html { font-size }` на `106.25%` (`$tablet`) и `112.5%` (`$laptop+`), из-за чего пропорционально раздувались `rem` на десктопе (в `jp.local` приходилось сбрасывать обратно к `16px` через 5 `@media`).
- **Стало:** в `css/supplies/_b11-base.scss` оставлен фиксированный `html { font-size: 100%; }` (16px по умолчанию) и добавлен `text-wrap: balance;` для `h1, .h1, h2, .h2, h3, .h3`.
- **Как найти в подтеме (regex):** `html\s*\{[^}]*font-size`
- **Что сделать в `project`:**
  - в `ff.local` и `lubr.local` явно перенести масштабирование `html` (`106.25%` на `$tablet`, `112.5%` на `$laptop`) в `_base.scss` внутри `@layer b11.base` для сохранения текущего дизайна;
  - в `jp.local` удалить избыточные 5 `@media` в `html { ... }`, оставив `font-size: 16px;`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-26] Оптимизация `_b11-buttons.scss` и `_b11-forms.scss`
- **Этап:** 2 | **Тип:** CHANGED
- **Было:** `_b11-buttons.scss` генерировал ~46 КБ (декартово умножение 5 базовых селекторов на все модификаторы и псевдоклассы); в `_b11-forms.scss` вкладки и базовые `details` находились в одном неслоёном пространстве; в обоих файлах возникали `mixed-decls`.
- **Стало:**
  - `_b11-buttons.scss` переписан через `:where(.button, input[type="submit"], input[type="button"], input[type="reset"])` и плоские модификаторы, переопределяющие только CSS-переменные `--btn-*`;
  - `_b11-forms.scss` использует `:where(...)` для инпутов и разделяет базовые формы (`@layer b11.elements`) и вкладки (`@layer b11.components`);
  - 0 предупреждений `mixed-decls`.
- **Как найти в подтеме (regex):** `--btn-bg|--btn-color`
- **Что сделать в `project`:** проверить пользовательские правила `mixed-decls` в паршалах подтемы (`ff.local`: `_blocks.scss`, `_product.scss`, `_views.scss`) и поднять свойства выше вложенных селекторов/`@include`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-27] Базовый модуль стилей CKEditor 5 (`_b11-ckeditor5.scss`)
- **Этап:** 2 | **Тип:** ADDED
- **Было:** стили содержимого WYSIWYG-редактора CKEditor 5 копировались вручную целиком внутри `project/css/ckeditor5.scss`.
- **Стало:** добавлен опциональный паршал `css/supplies/_b11-ckeditor5.scss` (`.ck.ck-content, .ck-content` и `.ck.ck-fullscreen__main-wrapper` на токенах `base11`, с поддержкой `code`/`pre` на `--font-family-mono`), подключаемый подтемами через `@use "../../base11/css/supplies/b11-ckeditor5";`.
- **Как найти в подтеме (regex):** `\.ck-content`
- **Что сделать в `project`:** существующие `ckeditor5.scss` перевести с `@import` на `@use`; использовать `_b11-ckeditor5.scss` в новых и рефакторируемых проектах.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-28] Файл брейкпоинтов `base11.breakpoints.yml`
- **Этап:** 2 | **Тип:** ADDED
- **Было:** файл `base11.breakpoints.yml` отсутствовал (Responsive Image и модули ядра не видели адаптивную сетку базовой темы).
- **Стало:** создан `base11.breakpoints.yml` с группами `base11.sm`, `base11.pd`, `base11.tb`, `base11.lp`, `base11.dt`, `base11.wd`, синхронизированными с `$grid-breakpoints` в `_b11-grid-variables.scss`.
- **Как найти в подтеме (regex):** `breakpoints\.yml`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-29] Перевод хуков темы на ООП (`src/Hook/Base11Hooks.php`)
- **Этап:** 2 | **Тип:** CHANGED / REMOVED
- **Было:** процедурные хуки в `base11.theme` с прямыми вызовами `\Drupal::service(...)`.
- **Стало:** все хуки перенесены в `src/Hook/Base11Hooks.php` (`namespace Drupal\base11\Hook;`, атрибуты `#[Hook('...')]`, конструкторный автовайринг `ThemeSettingsProvider`, `StringTranslationTrait`); файл `base11.theme` удалён (`theme-settings.php` сохранён). Версия темы в `base11.info.yml` — `2.0.0-alpha2`.
- **Как найти в подтеме (regex):** `base11_preprocess_|_base11_wrap_single_managed_files`
- **Что сделать в `project`:** убедиться, что подтема не вызывает удалённые внутренние функции `base11.theme`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-30] Удаление 22 дублирующих шаблонов и синхронизация с Drupal 11.4
- **Этап:** 2 | **Тип:** REMOVED / CHANGED
- **Было:** в `templates/` находились 22 шаблона, полностью дублирующие ядро, а также устаревшие `not page` в `taxonomy-term.html.twig`, избыточные `role="navigation"`/`banner`/`main`/`complementary`/`contentinfo` на HTML5-элементах, устаревшие `@see` и неполные атрибуты описаний в формах.
- **Стало:** 22 дубля удалены; 12 шаблонов синхронизированы со `starterkit_theme` Drupal 11.4 (`taxonomy-term`, `block--local-tasks-block`, `block--system-menu-block`, `breadcrumb`, `views-mini-pager`, `maintenance-page`, `form-element`, `fieldset`, `details`, `item-list--search-results`, `html`, `image`); в `datetime-wrapper.html.twig` сохранена обёртка `.form-datetime-wrapper` и обновлён `@see`.
- **Как найти в подтеме (regex):** `role="(navigation|banner|main|complementary|contentinfo)"|not page\b`
- **Что сделать в `project`:** при наличии скопированных шаблонов таксономии/форм в подтеме — учитывать актуальный синтаксис Drupal 11.4.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`

### [CHG-31] Возврат атрибутов `width` / `height` в `templates/field/image.html.twig`
- **Этап:** 2 | **Тип:** BREAKING / FIXED
- **Было:** `<img{{ attributes.addClass(classes)|without('width', 'height') }} />` принудительно вырезал HTML-атрибуты `width`/`height`, ухудшая Core Web Vitals (CLS).
- **Стало:** фильтр `|without('width', 'height')` удалён (`image.html.twig` синхронизирован со `starterkit_theme` Drupal 11.4).
- **Как найти в подтеме (regex):** `img\s*\{[^}]*height\s*:`
- **Что сделать в `project`:** во всех правилах `img` дочерней темы, где заданы фиксированные `height` или `max-height` без указания `width` (или `aspect-ratio`), явно добавить `width: auto;` (либо убедиться, что пропорции заданы корректно), чтобы браузер не растягивал картинку по HTML-атрибуту `width`.
- **Статус миграции:**
  - [x] `ff.local`
  - [x] `jp.local`
  - [x] `lubr.local`


---

## Этап 3 — A11y, JS-расширения и общие компоненты

### [CHG-32] Доступность (A11y) и клавиатурное управление в `menu-mobile.js`
- **Этап:** 3 | **Тип:** ADDED / FIXED
- **Было:** шторка `.page-offside` не закрывалась по `Escape`, не управляла `aria-expanded` и `inert` (клавиатурный фокус проваливался в скрытое меню), а `<div class="page-offside-label">` в старых подтемах не работал с клавиатуры.
- **Стало:** добавлены синхронизация `aria-expanded` на кнопках и пунктах подменю `.menu-item--expanded > a`, атрибут `inert` на скрытой/десктопной `.page-offside`, закрытие по `Escape` с возвратом фокуса на триггер, а также `role="button"`/`tabindex="0"` + `Enter`/`Space` при отсутствии нативного `<button>`.
- **Как найти в подтеме (regex):** `<div[^>]*class="[^"]*page-offside-label`
- **Что сделать в `project`:** заменить `<div class="page-offside-label">` на семантический `<button type="button" class="page-offside-label" aria-label="{{ 'Menu'|t }}" aria-expanded="false">` в `page.html.twig` (выполнено во всех 3 подтемах).
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`

### [CHG-33] Паттерн WAI-ARIA Tabs и троттлинг `ResizeObserver` в `tabs-js`
- **Этап:** 3 | **Тип:** FIXED
- **Было:** в `tabs-js.js` отсутствовал `role="tablist"`, `aria-controls` указывал на `data-id` вместо реального HTML `id`, у всех вкладок стоял `tabindex="0"`, отсутствовали `Home`/`End`/`Enter`/`Space`, а `ResizeObserver` мог вызывать цикл измерений.
- **Стало:** назначаются уникальные префиксированные `id` вкладкам и панелям (`aria-controls`/`aria-labelledby`), реализован roving `tabindex` (`0` / `-1`), клавиши `Home`/`End`/`Enter`/`Space`, троттлинг `ResizeObserver` через `requestAnimationFrame`; `tabs-js.scss` обёрнут в `@layer b11.components`.
- **Как найти в подтеме (regex):** `\.tabs-js\s*\{`
- **Что сделать в `project`:** удалить дублирующие базовые стили `.tabs-js` в подтемах (например в `jp.local/_tabs.scss`).
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`

### [CHG-34] Безопасность (XSS), доступность и локализация `facet-extension` и `facet-list-filter`
- **Этап:** 3 | **Тип:** FIXED
- **Было:** `facet-extension.js` вставлял заголовок через `innerHTML`, `legend` не управлялся с клавиатуры, модальное окно фильтра не имело `role="dialog"`/`aria-modal` и не закрывалось по `Escape`; в `facet-extension.scss` использовались хардкодные цвета; в `facet-list-filter.js` строки были без `Drupal.t()`, с Bootstrap-классом `.form-control` и `e.keyCode`.
- **Стало:** шапка и кнопки модалки создаются через DOM API + `textContent` + `Drupal.t()`; добавлены `role="button"`/`aria-expanded` на `legend`, `role="dialog"`/`aria-modal="true"` и закрытие по `Escape`; `facet-extension.scss` переведён на токены `base11` и `@layer b11.components`; в `facet-list-filter.js` — `type="search"`, `Drupal.t()`, `e.key === 'Enter'` без `form-control`.
- **Как найти в подтеме (regex):** `facet-list-filter|bef-exposed-form`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`

### [CHG-35] Доступность `back-to-top` и поддержка `prefers-reduced-motion`
- **Этап:** 3 | **Тип:** FIXED
- **Было:** `back-to-top.js` слушал `scroll` без `requestAnimationFrame`, не синхронизировал `aria-hidden`/`tabindex`, не проверял `prefers-reduced-motion` и начальную позицию прокрутки; `back-to-top.scss` содержал хардкодные цвета.
- **Стало:** добавлен rAF-троттлинг, учёт `prefers-reduced-motion: reduce`, `aria-hidden` + `tabindex`, клавиатурный фоллбэк и токены в `back-to-top.scss` внутри `@layer b11.components`.
- **Как найти в подтеме (regex):** `id="back-to-top".*display:\s*none|<div[^>]*id="back-to-top"`
- **Что сделать в `project`:** перевести `#back-to-top` в `page.html.twig` на `<button type="button" id="back-to-top" class="back-to-top" data-drupal-selector="back-to-top" aria-label="{{ 'Back to top'|t }}">`; в `jp.local` убрать `style="display: none;"` и сохранить квадратную форму кнопки в `_layout.scss`.
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`

### [CHG-36] Семантика закрытия и дефолтные цвета сообщений (`status-messages` / `base11/messages`)
- **Этап:** 3 | **Тип:** CHANGED / ADDED
- **Было:** кнопка закрытия в `status-messages.html.twig` была `<div class="close">`, автозакрытие не ставилось на паузу при клавиатурном фокусе (`focusin`), а в `messages.scss` не было цветов типов сообщений по умолчанию.
- **Стало:** `<button type="button" class="close" aria-label="{{ 'Close'|t }}">`; в `messages.js` добавлена пауза по `focusin`; в `messages.scss` (`@layer b11.components`) добавлена базовая палитра `.messages--error/info/status/warning` на дизайн-токенах `--status-*`.
- **Как найти в подтеме (regex):** `@use\s+"messages"`
- **Что сделать в `project`:** удалить дублирующий паршал `_messages.scss` в подтемах со стандартной палитрой (`ff.local`); темы с полностью кастомными тостами (`jp.local`) не затрагиваются.
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`

### [CHG-37] A11y, надёжность JS (`click-to-copy`, `swiper-thumbs`) и единый порядок слоёв в расширениях
- **Этап:** 3 | **Тип:** FIXED
- **Было:** `click-to-copy.js` озвучивал тултип при монтировании и не сбрасывал таймер; `swiper-thumbs.js` обращался к `drupalSettings.swipers[parentId]` без проверки; расширения `css/extensions/*.scss` находились вне `@layer`.
- **Стало:** добавлен отдельный `aria-live="polite"`, сброс таймера и валидация `strokeWidth` в `click-to-copy.js`; безопасная проверка `settings.swipers?.[parentId]` в `swiper-thumbs.js`; все standalone-расширения `css/extensions/*.scss` подключили `@use "../supplies/b11-layers";` и обёрнуты в `@layer b11.components`.
- **Как найти в подтеме (regex):** `click-to-copy|swiper-thumbs`
- **Что сделать в `project`:** правки не требуются.
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`

### [CHG-38] Адресное скрытие системного `.ajax-progress` в `ajax-spinner`
- **Этап:** 3 | **Тип:** FIXED
- **Было:** `css/extensions/ajax-spinner.scss` глобально скрывал `.ajax-progress, .ajax-progress-throbber { display: none !important; }`, отключая индикацию загрузки для `select`, чекбоксов и AJAX-фильтров.
- **Стало:** системный throbber скрывается только рядом/внутри кнопок (`.button`, `.btn`, `input[type="submit|button"]` без `.button--link`), а не-кнопочные AJAX-элементы отображают индикатор из `_b11-ajax.scss`. Из `project.info.yml` можно убрать дублирующее подключение `base11/ajax-spinner` (подключён в `base11`).
- **Как найти в подтеме (regex):** `base11/ajax-spinner`
- **Что сделать в `project`:** удалить избыточные подключения `base11/ajax-spinner` в `project.info.yml` (`ff.local`).
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`

### [CHG-39] Общие компоненты `.tabs.primary`, `.prose`, `<fieldset>` и библиотека `base11/media-library`
- **Этап:** 3 | **Тип:** ADDED
- **Было:** стили вкладок `.tabs.primary` дублировались в `ff.local` и `lubr.local`, оформление Media Library (~880 строк) жило только в `ff.local`, базовые `fieldset` и `.prose` не были оформлены в `base11`.
- **Стало:**
  - в `_b11-drupal-core.scss` добавлены `.tabs.primary` и `.tabs.secondary`;
  - в `_b11-base.scss` добавлен класс редакционной типографики `.prose`;
  - в `_b11-forms.scss` добавлен чистый каркас `<fieldset>`;
  - создана библиотека `base11/media-library` (`css/extensions/media-library.scss` в `@layer b11.components` с переменными `--ml-*`, подключена через `libraries-extend: media_library/widget`, `media_library/ui`; версия `base11.info.yml` — `2.0.0-alpha3`).
- **Как найти в подтеме (regex):** `@use\s+"tabs"|\.tabs\.primary|\.ui-dialog\.media-library-widget-modal`
- **Что сделать в `project`:** удалить дубликат `_tabs.scss` в `ff.local` и `lubr.local`; в `ff.local/_media-library.scss` оставить только компактную проектную настройку поверх `base11/media-library` (через токены `--ml-*` и точечные оверрайды без копирования базы).
- **Статус миграции:**
  - [ ] `ff.local`
  - [ ] `jp.local`
  - [ ] `lubr.local`