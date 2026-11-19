<?php

declare(strict_types=1);

namespace Drupal\base11\Hook;

use Drupal\Component\Render\FormattableMarkup;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Render\Element;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Template\Attribute;
use Drupal\Core\Theme\Icon\IconDefinition;

/**
 * ООП-реализации хуков базовой темы Base11 (стандарт Drupal 11.4+).
 */
class Base11Hooks implements TrustedCallbackInterface {
  use StringTranslationTrait;

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks(): array {
    return ['preRenderIconOverride', 'preRenderIconWindowsFallback'];
  }

  /**
   * Внедрение зависимостей темы через автовайринг контейнера.
   */
  public function __construct(
    protected readonly ThemeSettingsProvider $themeSettingsProvider,
  ) {}

  /**
   * Реализует hook_preprocess_HOOK() для шаблона html.html.twig.
   *
   * Передаёт в DOM и JS настройки расположения и порога переключения
   * выдвижного мобильного меню (page-offside).
   */
  #[Hook('preprocess_html')]
  public function preprocessHtml(array &$variables): void {
    // Сторона появления шторки мобильного меню (по умолчанию слева)
    $position = $this->themeSettingsProvider->getSetting('page-offside-position') ?? 'left';
    $variables['attributes']['class'][] = 'page-offside-' . $position;

    // Ширина экрана, с которой мобильное меню скрывается и включается десктопное
    $variables['#attached']['drupalSettings']['theme'] = [
      'page_offside_hide_width' => $this->themeSettingsProvider->getSetting('page-offside-hide-width') ?? '1024',
    ];
  }

  /**
   * Реализует hook_preprocess_HOOK() для шаблона image-widget.html.twig.
   *
   * Скрывает контейнер предпросмотра изображения для пользователей без прав доступа.
   */
  #[Hook('preprocess_image_widget')]
  public function preprocessImageWidget(array &$variables): void {
    $data = &$variables['data'];
    if (isset($data['preview']['#access']) && $data['preview']['#access'] === FALSE) {
      unset($data['preview']);
    }
  }

  /**
   * Реализует hook_preprocess_HOOK() для шаблона status-messages.html.twig.
   *
   * Сворачивает детальную сводку inline_form_errors в одно компактное сообщение,
   * сохраняя при этом все прочие системные, платежные и коммерческие ошибки.
   */
  #[Hook('preprocess_status_messages')]
  public function preprocessStatusMessages(array &$variables): void {
    if (empty($variables['message_list']['error'])) {
      return;
    }

    $has_form_errors = FALSE;
    $filtered_errors = [];

    foreach ($variables['message_list']['error'] as $message) {
      $message_str = (string) $message;

      // Структурный признак inline_form_errors: якорная ссылка <a href="#edit-...">
      if (str_contains($message_str, 'href="#')) {
        $has_form_errors = TRUE;
        continue;
      }

      // Прочие ошибки (оплата, корзина, права доступа, система) сохраняем без изменений
      $filtered_errors[] = $message;
    }

    if ($has_form_errors) {
      array_unshift($filtered_errors, $this->t('Please check the highlighted fields for errors.'));
      $variables['message_list']['error'] = $filtered_errors;
    }
  }

  /**
   * Реализует hook_preprocess_HOOK() для шаблона input.html.twig.
   *
   * Динамически подключает библиотеку показа/скрытия пароля только при наличии input[type="password"].
   */
  #[Hook('preprocess_input')]
  public function preprocessInput(array &$variables): void {
    if (isset($variables['attributes']['type']) && $variables['attributes']['type'] === 'password') {
      $variables['#attached']['library'][] = 'base11/password-toggle';
    }
  }

  /**
   * Реализует hook_element_info_alter() для рендер-элемента icon.
   *
   * Встраивает колбэк автоподмены иконок перед рендером ядра, позволяя активной
   * дочерней теме переопределять одноимённые иконки base11 собственным паком.
   */
  #[Hook('element_info_alter')]
  public function elementInfoAlter(array &$types): void {
    if (isset($types['icon']['#pre_render']) && is_array($types['icon']['#pre_render'])) {
      array_unshift($types['icon']['#pre_render'], [self::class, 'preRenderIconOverride']);
      $types['icon']['#pre_render'][] = [self::class, 'preRenderIconWindowsFallback'];
    }
  }

  /**
   * Автоматически переключает #pack_id с base11 на активную подтему,
   * если в её пачке иконок (<theme>.icons.yml) объявлена иконка с тем же ID.
   */
  public static function preRenderIconOverride(array $element): array {
    if (($element['#pack_id'] ?? '') !== 'base11' || empty($element['#icon_id'])) {
      return $element;
    }

    $active_theme = \Drupal::theme()->getActiveTheme()->getName();
    if ($active_theme === 'base11') {
      return $element;
    }

    $definitions = \Drupal::service('plugin.manager.icon_pack')->getDefinitions();
    $override_id = $active_theme . ':' . $element['#icon_id'];
    if (isset($definitions[$active_theme]['icons'][$override_id])) {
      $element['#pack_id'] = $active_theme;
    }

    return $element;
  }

  /**
   * Фоллбэк рендера SVG-иконок на Windows (OSPanel6).
   *
   * В Drupal 11.4 метод IconFinder::getFileContents() отклоняет пути Windows
   * с диском вида C:\..., так как parse_url() воспринимает букву диска как scheme.
   * На Linux и в исправленных версиях ядра inline-template уже сформирован
   * штатным Icon::preRenderIcon(), поэтому колбэк завершается сразу без работы.
   */
  public static function preRenderIconWindowsFallback(array $element): array {
    if (isset($element['inline-template'])) {
      return $element;
    }

    $pack_id = (string) ($element['#pack_id'] ?? '');
    $icon_id = (string) ($element['#icon_id'] ?? '');
    if ($pack_id === '' || $icon_id === '') {
      return $element;
    }

    // Ограничиваем фоллбэк паками base11 и активной подтемы.
    $active_theme = \Drupal::theme()->getActiveTheme()->getName();
    if ($pack_id !== 'base11' && $pack_id !== $active_theme) {
      return $element;
    }

    $definitions = \Drupal::service('plugin.manager.icon_pack')->getDefinitions();
    $definition = $definitions[$pack_id] ?? NULL;
    if (!$definition || ($definition['extractor'] ?? '') !== 'svg' || empty($definition['template'])) {
      return $element;
    }

    $icon_full_id = IconDefinition::createIconId($pack_id, $icon_id);
    $icon_data = $definition['icons'][$icon_full_id] ?? NULL;
    if (empty($icon_data['absolute_path'])) {
      return $element;
    }

    static $svg_cache = [];
    $path = $icon_data['absolute_path'];

    if (!array_key_exists($path, $svg_cache)) {
      $svg_cache[$path] = NULL;
      $real_root = realpath(\Drupal::root());
      $real_file = realpath($path);

      if (
        $real_root !== FALSE &&
        $real_file !== FALSE &&
        is_file($real_file) &&
        str_starts_with(strtolower($real_file), strtolower($real_root) . DIRECTORY_SEPARATOR) &&
        str_ends_with(strtolower($real_file), '.svg')
      ) {
        $raw = file_get_contents($real_file);
        if ($raw !== FALSE) {
          libxml_use_internal_errors(TRUE);
          $svg = simplexml_load_string($raw);
          libxml_clear_errors();
          if ($svg !== FALSE) {
            $inner = '';
            foreach ($svg as $child) {
              $inner .= $child->asXML();
            }
            if ($inner !== '') {
              $raw_attributes = [];
              foreach ($svg->attributes() as $name => $value) {
                $raw_attributes[$name] = (string) $value;
              }
              $svg_cache[$path] = [
                'content' => $inner,
                'raw_attributes' => $raw_attributes,
              ];
            }
          }
        }
      }
    }

    if ($svg_cache[$path] === NULL) {
      return $element;
    }

    // Создаём свежий объект Attribute на каждый рендер, чтобы вызовы в шаблоне не мутировали общий кэш.
    $data_definition = array_diff_key($definition, array_flip(['enabled', 'template', 'description', 'links', 'config']));
    $extractor_data = [
      'content' => new FormattableMarkup($svg_cache[$path]['content'], []),
      'attributes' => new Attribute($svg_cache[$path]['raw_attributes']),
    ] + $data_definition;

    $settings = is_array($element['#settings'] ?? NULL) ? $element['#settings'] : [];
    $context = ['icon_id' => $icon_id];
    if (!empty($icon_data['source'])) {
      $context['source'] = $icon_data['source'];
    }

    $element['inline-template'] = [
      '#type' => 'inline_template',
      '#template' => $definition['template'],
      '#context' => array_merge($extractor_data, $settings, $context),
    ];

    if (!empty($definition['library'])) {
      $element['inline-template']['#attached'] = ['library' => [$definition['library']]];
    }

    return $element;
  }

  /**
   * Реализует hook_form_alter().
   *
   * Архитектурная связь с библиотекой base11/file-upload:
   * Приводит одиночные поля загрузки файлов (managed_file) к единой структуре
   * множественных полей (<details> -> .form-type-managed-file) и маркирует их дропзоной.
   */
  #[Hook('form_alter')]
  public function formAlter(array &$form, FormStateInterface $form_state, string $form_id): void {
    $this->wrapSingleManagedFiles($form, $form);
  }

  /**
   * Рекурсивно оборачивает одиночные виджеты managed_file в элемент details
   * и добавляет класс .file-upload--dropzone виджетам загрузки файлов сущностей.
   */
  private function wrapSingleManagedFiles(array &$elements, array &$form): void {
    // Одиночное поле managed_file без обёртки details
    if (
      isset($elements['widget'][0]['#type']) &&
      $elements['widget'][0]['#type'] === 'managed_file' &&
      (!isset($elements['widget']['#type']) || $elements['widget']['#type'] !== 'details')
    ) {
      $title = $elements['widget'][0]['#title'] ?? $elements['#title'] ?? '';
      $elements['widget']['#type'] = 'details';
      $elements['widget']['#open'] = TRUE;
      $elements['widget']['#title'] = $title;
      $elements['widget'][0]['#title'] = $this->t('Добавить файл');

      $existing_classes = $elements['widget'][0]['#wrapper_attributes']['class'] ?? [];
      if (!in_array('file-upload--compact', $existing_classes, TRUE) && !in_array('file-upload--dropzone', $existing_classes, TRUE)) {
        $elements['widget'][0]['#wrapper_attributes']['class'][] = 'file-upload--dropzone';
      }

      if (!in_array('base11/file-upload', $form['#attached']['library'] ?? [], TRUE)) {
        $form['#attached']['library'][] = 'base11/file-upload';
      }
    }

    // Множественные поля managed_file (виджет сущностей file_widget_multiple)
    if (isset($elements['widget']['#theme']) && $elements['widget']['#theme'] === 'file_widget_multiple') {
      foreach (Element::children($elements['widget']) as $delta) {
        if (isset($elements['widget'][$delta]['#type']) && $elements['widget'][$delta]['#type'] === 'managed_file') {
          $existing_classes = $elements['widget'][$delta]['#wrapper_attributes']['class'] ?? [];
          if (!in_array('file-upload--compact', $existing_classes, TRUE) && !in_array('file-upload--dropzone', $existing_classes, TRUE)) {
            $elements['widget'][$delta]['#wrapper_attributes']['class'][] = 'file-upload--dropzone';
          }
        }
      }
    }

    // При наличии любого managed_file в ветке подключаем расширение base11/file-upload
    if (
      (isset($elements['#type']) && $elements['#type'] === 'managed_file') ||
      (isset($elements['widget']['#type']) && $elements['widget']['#type'] === 'details' && isset($elements['widget'][0]['#type']) && $elements['widget'][0]['#type'] === 'managed_file')
    ) {
      if (!in_array('base11/file-upload', $form['#attached']['library'] ?? [], TRUE)) {
        $form['#attached']['library'][] = 'base11/file-upload';
      }
    }

    // Рекурсивный обход дочерних элементов формы
    foreach (Element::children($elements) as $key) {
      $this->wrapSingleManagedFiles($elements[$key], $form);
    }
  }

}
