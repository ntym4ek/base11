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
