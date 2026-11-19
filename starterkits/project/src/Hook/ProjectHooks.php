<?php

declare(strict_types=1);

namespace Drupal\project\Hook;

use Drupal\Core\Hook\Attribute\Hook;

/**
 * ООП-хуки подтемы Project (стандарт Drupal 11.4+).
 */
class ProjectHooks {

  /**
   * Реализует hook_preprocess_HOOK() для шаблона page.html.twig.
   */
  #[Hook('preprocess_page')]
  public function preprocessPage(array &$variables): void {
    // Добавьте общие переменные страницы (логотипы, счётчики, ссылки и т.д.).
  }

}
