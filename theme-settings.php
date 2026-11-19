<?php

/**
 * @file
 * Functions to support Base11 theme settings.
 */

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;

/**
 * Implements hook_form_FORM_ID_alter() for system_theme_settings.
 */
function base11_form_system_theme_settings_alter(&$form, FormStateInterface $form_state): void
{
  $settings = \Drupal::service(ThemeSettingsProvider::class);

  $form['other'] = [
    '#type' => 'details',
    '#title' => t('Additional settings'),
    '#weight' => 5,
    '#open' => TRUE,
  ];

  $form['other']['page-offside-position'] = [
    '#type' => 'select',
    '#title' => t('Mobile menu position'),
    '#default_value' => $settings->getSetting('page-offside-position') ?? 'left',
    '#options' => [
      'left' => t('Left'),
      'right' => t('Right'),
    ],
  ];

  $form['other']['page-offside-hide-width'] = [
    '#type' => 'number',
    '#title' => t('Mobile menu breakpoint'),
    '#description' => t('Viewport width (px) at which the mobile menu switches to desktop.'),
    '#default_value' => $settings->getSetting('page-offside-hide-width') ?? 1024,
    '#min' => 320,
    '#max' => 2560,
  ];
}
