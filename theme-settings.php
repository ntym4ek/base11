<?php

/**
 * @file
 * Functions to support Olivero theme settings.
 */

use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;

/**
 * Implements hook_form_FORM_ID_alter() for system_theme_settings.
 */
function base11_form_system_theme_settings_alter(&$form, FormStateInterface $form_state): void
{
  $form['other'] = array(
    '#type' => 'fieldset',
    '#title' => 'Дополнительные настройки',
    '#weight' => 5,
    '#collapsible' => TRUE,
    '#collapsed' => FALSE,
  );

  $form['other']['page-offside-position'] = array(
    '#type' => 'select',
    '#title' => 'Позиция мобильного меню',
    '#default_value' => \Drupal::service(ThemeSettingsProvider::class)->getSetting('page-offside-position') ?? 'left',
    '#options' => [
      'left' => 'Слева',
      'right' => 'Справа',
    ],
  );
  $form['other']['page-offside-hide-width'] = array(
    '#type' => 'textfield',
    '#title' => 'Breakpoint меню мобильной версии',
    '#description' => 'Ширина экрана, начиная с которой мобильное меню заменяется на десктопное',
    '#default_value' => \Drupal::service(ThemeSettingsProvider::class)->getSetting('page-offside-hide-width') ?? '1024',
  );
}
