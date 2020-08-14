import "./toolbar.css"
import Control from "ol/control/Control"

export var PlanToolBar = /*@__PURE__*/(function (Control) {
  function ToolBar(event, opt_options) {
    const options = opt_options || {};

    this.element = $("<div class='toolbar ol-unselectable ol-control'></div>");
    this.group = {};

    let createButton = (text, handler, hint, toggle = false, activeHigh = true) => {
      let btn = $("<button class='tool'></button>");
      if(hint) btn.attr("title", hint);
      btn.html(text);
      btn.on("click", handler.bind(btn[0]));

      if(activeHigh === false) btn.addClass("active");

      if(toggle) btn.on("click", () => {
        if(btn.hasClass("active")) {
          btn.removeClass("active");
        }
        else btn.addClass("active");
      });

      this.element.append(btn);
      return btn;
    };

    let createWhiteSpace = () => {
      let ws = $("<div class='whitespace'></div>");
      this.element.append(ws);
      return ws;
    };

    let createGroup = (name, elts) => {
      this.group[name] = {
        elts,
        show() {
          this.elts.forEach((e) => {
            e.slideDown.call(e, arguments)
          });
        },
        hide() {
          this.elts.forEach((e) => {
            e.slideUp.call(e, arguments)
          });
        }
      }
    };

    createButton("<span class='vj4-icon icon-delete'></span>", () => {
      event.emit("clear");
    }, "清除");
    createButton("<span class='vj4-icon icon-return'></span>", () => {
      event.emit("undo");
    }, "撤销");
    createWhiteSpace();
    this.pin = createButton("<span class='vj4-icon icon-tag'></span>", () => {
      event.emit("togglePin")
    }, "地图钉模式", true);
    this.pen = createButton("<span class='vj4-icon icon-edit'></span>", () => {
      event.emit("togglePen")
    }, "画笔模式", true);

    createGroup("penTools", [
      createWhiteSpace(),
      createButton("<span class='vj4-icon icon-wrench'></span>", () => {
        event.emit("toggleEdit")
      }, "编辑路径点", true),
      createButton("M", function () {
        event.emit("toggleMagnet");
      }, "吸附", true),
      createWhiteSpace(),
      createButton("<span class='vj4-icon icon-search'></span>", () => {
        event.emit("optimize");
      }, "提交路径规划"),
      createButton("<span class='vj4-icon icon-flag'></span>", () => {
        event.emit("zone");
      }, "提交图块信息")
    ]);
    this.group.penTools.hide();

    createGroup("pinTools", [
      createWhiteSpace(),
      createButton("<span class='vj4-icon icon-preview'></span>", () => {
        event.emit("selection")
      }, "选择地图钉"),
      createWhiteSpace(),
      createButton("<span class='vj4-icon icon-search'></span>", () => {
        event.emit("optimize");
      }, "提交路径规划"),
      createButton("<span class='vj4-icon icon-upload'></span>", () => {
        event.emit("store");
      }, "存储路径信息"),
    ]);
    this.group.pinTools.hide();

    this.element.children().tooltip({
      placement: 'right',
      container: '#map',
    });

    $('.ol-zoom-in, .ol-zoom-out').tooltip({
      placement: 'right',
      container: '#map',
    });

    Control.call(this, {
      element: this.element[0],
      target: options.target,
    });
  }

  if ( Control ) ToolBar.__proto__ = Control;
  ToolBar.prototype = Object.create( Control && Control.prototype );
  ToolBar.prototype.constructor = ToolBar;

  return ToolBar;
}(Control));
