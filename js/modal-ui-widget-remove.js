/**
 * @file
 * При создании модального окна убрать из разметки класс ui-widget,
 * задающий много ненужных стилей
 */

(($) => {

    // подмена стандартного jQuery Dialog _create
    let _create = $.ui.dialog.prototype._create;
    $.ui.dialog.prototype._create = function () {
        _create.call(this);
        // Сразу после создания — убираем лишние классы.
        this.uiDialog.removeClass('ui-widget ui-widget-content');
    };

})(jQuery);
