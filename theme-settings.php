<?php

/**
 * @file
 * Настройки темы Base11 в административном интерфейсе оформления.
 */

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;

/**
 * Implements hook_form_FORM_ID_alter() for system_theme_settings.
 *
 * Добавляет параметры мобильной навигации, которые затем передаются в разметку
 * и JS через base11_preprocess_html() (класс .page-offside-* и drupalSettings.theme).
 */
function base11_form_system_theme_settings_alter(&$form, FormStateInterface $form_state): void
{
  $settings = \Drupal::service(ThemeSettingsProvider::class);

  // Секция дополнительных настроек оформления темы Base11.
  $form['other'] = [
    '#type' => 'details',
    '#title' => t('Additional settings'),
    '#weight' => 5,
    '#open' => TRUE,
  ];

  // Сторона выезда мобильной шторки меню (класс .page-offside-left / .page-offside-right на body).
  $form['other']['page-offside-position'] = [
    '#type' => 'select',
    '#title' => t('Mobile menu position'),
    '#default_value' => $settings->getSetting('page-offside-position') ?? 'left',
    '#options' => [
      'left' => t('Left'),
      'right' => t('Right'),
    ],
  ];

  // Порог ширины экрана (в px), передаётся в js/menu-mobile.js через drupalSettings.theme.page_offside_hide_width.
  $form['other']['page-offside-hide-width'] = [
    '#type' => 'number',
    '#title' => t('Mobile menu breakpoint'),
    '#description' => t('Viewport width (px) at which the mobile menu switches to desktop.'),
    '#default_value' => $settings->getSetting('page-offside-hide-width') ?? 1024,
    '#min' => 320,
    '#max' => 2560,
  ];
}
