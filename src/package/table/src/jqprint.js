/**
 * jqprint 0.3（与用户项目逻辑一致）
 * https://github.com/recoding-it/jqprint
 */
import jQuery from "jquery";

(function ($) {
  jQuery.browser = jQuery.browser || {};

  $.fn.jqprint = function (options) {
    const opt = $.extend({}, $.fn.jqprint.defaults, options);
    const $element = this instanceof jQuery ? this : $(this);

    let doc;
    let printWindow;
    let $iframe;

    if (opt.operaSupport && $.browser.opera) {
      printWindow = window.open("", "jqPrint-preview");
      printWindow.document.open();
      doc = printWindow.document;
    } else {
      $iframe = $("<iframe />");
      if (!opt.debug) {
        $iframe.css({ position: "absolute", width: "0px", height: "0px", left: "-600px", top: "-600px" });
      }
      $iframe.appendTo("body");
      doc = $iframe[0].contentWindow.document;
    }

    if (opt.importCSS) {
      if ($("link[media=print]").length > 0) {
        $("link[media=print]").each(function () {
          doc.write(
            "<link type='text/css' rel='stylesheet' href='" + $(this).attr("href") + "' media='print' />"
          );
        });
      } else {
        $("link").each(function () {
          doc.write("<link type='text/css' rel='stylesheet' href='" + $(this).attr("href") + "' />");
        });
      }
    }

    if (opt.printContainer) {
      doc.write($element.outer());
    } else {
      $element.each(function () {
        doc.write($(this).html());
      });
    }

    doc.close();

    const target = opt.operaSupport && $.browser.opera ? printWindow : $iframe[0].contentWindow;
    target.focus();
    setTimeout(function () {
      target.print();
      if (printWindow) {
        printWindow.close();
      }
    }, 1000);
  };

  $.fn.jqprint.defaults = {
    debug: false,
    importCSS: true,
    printContainer: true,
    operaSupport: true,
  };

  jQuery.fn.outer = function () {
    return $($("<div></div>").html(this.clone())).html();
  };
})(jQuery);

export default jQuery;
