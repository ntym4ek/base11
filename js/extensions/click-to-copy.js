/**
 * @file
 * Всплывающая при наведении иконка для копирования строки
 */

((Drupal, once) => {

  // Query all the elements on the DOM with class click-to-copy
  const copyDivs = document.querySelectorAll(".click-to-copy");
  const copyText = Drupal.t("Copy to clipboard");
  const failText = Drupal.t("Failed to copy");
  const copiedText = Drupal.t("Copied");

  /**
   * Копировать текст в буфер
   * Now the actual copy to clipboard function
   */
  function copyToClipboard (text, icon, element) {
    // use the new ClipboardEvent API
    if (window.clipboardData && window.clipboardData.setData) {
      // IE specific code path to prevent textarea being shown while dialog is visible.
      return clipboardData.setData("Text", text);
      // If the new one is not supported, try the old one with execCommand("copy")
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      let textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand("copy");
      } catch (ex) {
        console.warn("Copy to clipboard failed.", ex);
        element.innerHTML = failText;
        return false;
      } finally {
        document.body.removeChild(textarea);
        element.innerHTML = copiedText;
        icon.classList.add("click-to-copy-copied");
        setTimeout(function () {
          element.innerHTML = copyText;
        }, 1000);
        setTimeout(function () {
          icon.classList.remove("click-to-copy-copied");
        }, 100);
      }
    }
  }

  /**
   * Добавить иконку, tooltip и обработчик
   * function to go through all the items with .click-to-copy class and build tooltips and clipboard copy image + event
   */
  function buildClickToCopy() {
    // Start the whole deal only if there are elements with class "click-to-copy" in the DOM
    if (copyDivs.length > 0) {
      // Loop through all the found click-to-copy elements
      for (let i = 0; i < copyDivs.length; ++i) {
        // create the div that will encompass the entire clipboard image + tooltip
        const createTooltipDiv = document.createElement("div");
        // add class tooltip
        createTooltipDiv.classList.add("click-to-copy__tooltip");
        // insert it right after the click-to-copy element
        copyDivs[i].parentNode.insertBefore(createTooltipDiv, copyDivs[i].nextSibling);
        // save the tooltip div to a variable for later use
        const tooltipDiv = document.getElementsByClassName("click-to-copy__tooltip")[i];
        // Let's create the SVG icon
        // Default is black
        let iconStroke = "#aaa";
        // Default 1.5 seems clean
        let strokeWidth = 1.5;
        // Check if data attributes have been passed, like the stroke color (data-clipboard-icon-stroke) and stroke width (data-clipboard-icon-stroke-width)
        if (copyDivs[i].dataset.clipboardIconStroke) {
          iconStroke = copyDivs[i].dataset.clipboardIconStroke;
        }
        if (copyDivs[i].dataset.clipboardIconStrokeWidth) {
          strokeWidth = copyDivs[i].dataset.clipboardIconStrokeWidth;
        }
        // The icon itself - taken from https://tablericons.com/
        let clipboardImgSource = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></svg>';
        // Because we will be creating the SVG from a string, we need a parent element
        let div = document.createElement("div");
        // Append it to the new div
        div.innerHTML = clipboardImgSource;
        // Add it as a child of the tooltip main div
        tooltipDiv.appendChild(div);
        // Now actually get the new SVG element as an HTML Node element
        let clipboardImg = div.firstElementChild;
        // Add it the click-to-copy__icon class (needed later)
        clipboardImg.classList.add("click-to-copy__icon");
        // Apply the stroke
        // clipboardImg.style.stroke = iconStroke;
        // Apply the stroke-width
        clipboardImg.style.strokeWidth = strokeWidth;
        // create a <span> that will hold the tooltip text "Copy to clipboard"
        const createTooltipText = document.createElement("span");
        // Add tooltiptext class to it for styling
        createTooltipText.classList.add("click-to-copy__tooltiptext");
        // Set the text to Copy to Clipboard
        createTooltipText.innerHTML = copyText;
        // Add it as a child of the tooltip div
        tooltipDiv.appendChild(createTooltipText);
        // Save the text value of the click-to-copy element that will need saving to clipboard, for usre in the copyToClipboard function
        const text = copyDivs[i].innerHTML;
        //  Save the tooltip span element so it can be used in the copyToClipboard function (to change the text to Copied! after clicking)
        const element = document.getElementsByClassName("click-to-copy__tooltiptext")[i];
        // Set the onclick event listener on the clipboard icon
        document.getElementsByClassName("click-to-copy__icon")[i].addEventListener("click", function() {
          copyToClipboard(text, this, element)
        }, false);
      }
    }
  }

  /**
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   При появлении сообщения на странице показать его сверху страницы.
   *   Убрать его через 10 секунд или по нажатию на кнопку.
   *   При наведении курсора на сообщение, не закрывать сообщение автоматически
   *   и убрать через секунду, после смещения курсора за его пределы.
   */
  Drupal.behaviors.clickToCopy = {
    attach(context) {
      once('click-to-copy-once', '.click-to-copy', context).forEach(
        buildClickToCopy
      );
    },
  };

})(Drupal, once);


