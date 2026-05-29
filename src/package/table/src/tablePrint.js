/**
 * 表格打印：内置 jqprint，用户无需配置 jQuery / jqprint
 */
import $ from "./jqprint.js";

export function printTableElement(el, options) {
  if (!el) return;

  const $printEl = $(el);
  $printEl.show();
  $printEl.jqprint(
    $.extend(
      {
        debug: false,
        importCSS: true,
        printContainer: true,
        operaSupport: true,
      },
      options
    )
  );
  $printEl.hide();
}
