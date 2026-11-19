/**
 * @file
 * Декларативное управление нативными диалогами и шторками <dialog> (base11/native-dialog).
 *
 * Атрибуты:
 * - [data-b11-dialog-open="#id"]  — кнопка/ссылка для открытия диалога через showModal()
 * - [data-b11-dialog-close]       — элемент закрытия внутри открытого <dialog>
 * - [data-b11-dialog-static]      — запрещает закрытие по клику на затемнённый фон (::backdrop)
 */
((Drupal, once) => {
  'use strict';

  Drupal.behaviors.base11NativeDialog = {
    attach(context) {
      // Триггеры открытия диалогов
      once('base11-dialog-open', '[data-b11-dialog-open]', context).forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
          const selector = trigger.getAttribute('data-b11-dialog-open');
          if (!selector) return;

          const dialog = document.querySelector(selector);
          if (!(dialog instanceof HTMLDialogElement)) return;

          event.preventDefault();
          if (!dialog.open) {
            dialog.showModal();
          }
        });
      });

      // Поведение самого <dialog>: кнопки закрытия и клик по backdrop
      once('base11-dialog', 'dialog.b11-dialog', context).forEach((dialog) => {
        if (!(dialog instanceof HTMLDialogElement)) return;

        dialog.querySelectorAll('[data-b11-dialog-close]').forEach((closer) => {
          closer.addEventListener('click', () => {
            if (dialog.open) {
              dialog.close('dismiss');
            }
          });
        });

        // Клик вне области содержимого (на ::backdrop в Top Layer) закрывает окно
        dialog.addEventListener('click', (event) => {
          if (event.target === dialog && !dialog.hasAttribute('data-b11-dialog-static')) {
            dialog.close('backdrop');
          }
        });
      });
    },
  };
})(Drupal, once);
