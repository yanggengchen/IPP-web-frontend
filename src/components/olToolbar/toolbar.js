import "./toolbar.css"
import Control from "ol/control/Control"

export var ToolBar = /*@__PURE__*/(function (Control) {
  function ToolBar(event, opt_options) {
    const options = opt_options || {};


    const element = $("<div class='toolbar ol-unselectable ol-control'></div>");

    let createButton = (text, handler, hint, toggle = false) => {
      let btn = $("<button class='tool'></button>");
      if(hint) btn.attr("title", hint);
      btn.html(text);
      btn.on("click", handler.bind(btn[0]));

      if(toggle) btn.on("click", () => {
        if(btn.hasClass("active")) {
          btn.removeClass("active");
        }
        else btn.addClass("active");
      });

      element.append(btn);
    };

    let createWhiteSpace = () => {
      let ws = $("<div class='whitespace'></div>");
      element.append(ws);
    };

    createButton("C", () => {
      event.emit("clear");
    }, "清除");
    createButton("U", () => {
      event.emit("undo");
    }, "撤销");
    createWhiteSpace();
    createButton("M", function () {
      event.emit("switchMagnet");
    }, "吸附", true);
    createWhiteSpace();
    createButton("O", () => {
      event.emit("optimize");
    }, "提交路径优化");
    createButton("Z", () => {
      event.emit("zone");
    }, "提交图块信息");

    element.children().tooltip({
      placement: 'right',
      container: '#map',
    });

    $('.ol-zoom-in, .ol-zoom-out').tooltip({
      placement: 'right',
      container: '#map',
    });

    Control.call(this, {
      element: element[0],
      target: options.target,
    });
  }

  if ( Control ) ToolBar.__proto__ = Control;
  ToolBar.prototype = Object.create( Control && Control.prototype );
  ToolBar.prototype.constructor = ToolBar;

  return ToolBar;
}(Control));
