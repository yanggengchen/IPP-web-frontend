import "./toolbar.css"
import Control from "ol/control/Control"

export var PlanToolBar = /*@__PURE__*/(function (Control) {
  function ToolBar(event, opt_options) {
    const options = opt_options || {};

    this.element = $("<div class='toolbar ol-unselectable ol-control'></div>");
    this.group = {};

    let createButton = (text, handler, hint, toggle = false, radioGroup = "", exact = true) => {
      let btn = $("<button class='tool'></button>");
      if(hint) btn.attr("title", hint);
      btn.html(text);
      btn.active = !exact;
      btn.on("click", handler.bind(btn[0]));

      if(exact === false) btn.addClass("active");

      if(!radioGroup) {
        if (toggle) btn.on("click", () => {
          if (btn.active) {
            btn.removeClass("active");
          } else btn.addClass("active");
          btn.active = !btn.active;
        });
      } else {
        if(!this.group[radioGroup]) createGroup(radioGroup, []);
        this.group[radioGroup].elts.push(btn);
        btn.on("click", () => {
          if(!btn.active) {
            this.group[radioGroup].elts.forEach((i) => {
              i.removeClass("active");
              i.active = false;
            });
            btn.addClass("active");
            btn.active = true;
          }
        })
      }

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

    let createAssociation = (btn, group, radioGroup = "") => {
      if(btn.active) this.group[group].show();
      else this.group[group].hide();
      btn.on("click", () => {
        if(btn.active) this.group[group].show();
        else this.group[group].hide();
      });
      if(radioGroup) {
        this.group[radioGroup].elts.forEach((e) => {
          e.on("click", () => {
            if(btn.active) this.group[group].show();
            else this.group[group].hide();
          })
        })
      }
    };

    createButton("<span class='vj4-icon icon-delete'></span>", () => {
      event.emit("clear");
    }, "清除");
    createButton("<span class='vj4-icon icon-return'></span>", () => {
      event.emit("undo");
    }, "撤销");
    createWhiteSpace();
    createButton("<span class='vj4-icon icon-info'></span>", () => {
      event.emit("toggleZone")
    }, "区域编辑模式", true, "modeSwitch", false);
    this.pin = createButton("<span class='vj4-icon icon-tag'></span>", () => {
      event.emit("togglePin")
    }, "地图钉模式", true, "modeSwitch");
    this.pen = createButton("<span class='vj4-icon icon-edit'></span>", () => {
      event.emit("togglePen")
    }, "画笔模式", true, "modeSwitch");

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
    createAssociation(this.pen, "penTools", "modeSwitch");

    createGroup("pinTools", [
      createWhiteSpace(),
      createButton("<span class='vj4-icon icon-circle--outline'></span>", () => {
        event.emit("selection")
      }, "选择地图钉", true),
      createButton("<span class='vj4-icon icon-preview'></span>", () => {
        event.emit("toggleViewRoutine")
      }, "查看连接路线", true, "", false),
      createWhiteSpace(),
      createButton("<span class='vj4-icon icon-search'></span>", () => {
        event.emit("optimize");
      }, "提交路径规划"),
      createButton("<span class='vj4-icon icon-upload'></span>", () => {
        event.emit("store");
      }, "存储路径信息"),
    ]);
    createAssociation(this.pin, "pinTools", "modeSwitch");

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
