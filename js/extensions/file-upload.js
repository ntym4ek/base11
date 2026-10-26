/**
 * @file
 * Drag & drop and visual feedback handler for managed file uploads (base11).
 *
 * Архитектурная связь:
 * - Дополняет функциональное расширение css/extensions/file-upload.css.
 * - Обрабатывает события dragenter, dragover, dragleave, drop на блоках .form-type-managed-file.
 * - Использует счетчик dragCounter для предотвращения мигания класса .is-dragover
 *   при прохождении курсора над дочерними элементами (label, description, etc.).
 * - При drop наполняет files у нативного input[type="file"] и генерирует событие 'change',
 *   которое перехватывается стандартным скриптом Drupal core (fileAutoUpload).
 */

((Drupal, once) => {
  'use strict';

  Drupal.behaviors.base11FileUpload = {
    attach(context) {
      const dropzones = once('base11-file-dropzone', '.form-type-managed-file, .form-type--managed-file', context);

      dropzones.forEach((dropzone) => {
        const fileInput = dropzone.querySelector('input[type="file"]');
        if (!fileInput) {
          return;
        }

        let dragCounter = 0;

        dropzone.addEventListener('dragenter', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter++;
          dropzone.classList.add('is-dragover');
        });

        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('is-dragover');
        });

        dropzone.addEventListener('dragleave', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter--;
          if (dragCounter <= 0) {
            dragCounter = 0;
            dropzone.classList.remove('is-dragover');
          }
        });

        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounter = 0;
          dropzone.classList.remove('is-dragover');

          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            try {
              fileInput.files = e.dataTransfer.files;
            } catch (err) {
              // Fallback for browsers with strict DataTransfer assignment restrictions
              const dataTransfer = new DataTransfer();
              for (let i = 0; i < e.dataTransfer.files.length; i++) {
                dataTransfer.items.add(e.dataTransfer.files[i]);
              }
              fileInput.files = dataTransfer.files;
            }

            // Trigger change event so Drupal core fileAutoUpload activates the upload button
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });
    },
  };
})(Drupal, once);
