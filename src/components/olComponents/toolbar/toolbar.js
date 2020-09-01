import "./toolbar.css"
import Control from "ol/control/Control"
import EventEmitter from "events"

export var ToolBar = /*@__PURE__*/(function (Control) {
  let event = new EventEmitter();

  function ToolBar(opt_options) {
    const options = opt_options || {};

    this.element = $("<div class='toolbar ol-unselectable ol-control'></div>");
    this.group = {};
    this.event = event;

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
      }
      else {
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

    let DSLCreate = (group) => {
      if(group instanceof Array) { // 创建列表
        let result = []
        group.forEach((element) => {
          result.push(DSLCreate(element));
        });
        return result;
      } else { // 创建元素
        switch(group.type) {
          case "button":
            let text = group.text,
              eventHandler = group.event,
              hint = group.hint,
              toggle = group.toggle || false,
              radioGroup = group.radioGroup || "";
            let result = createButton(
              text,
              () => {
                event.emit(eventHandler)
              },
              hint,
              toggle,
              radioGroup);
            if(group.association)
              createAssociation(result, group.association, radioGroup);
            return result;
          case "group":
            let name = group.name;
            return createGroup(name, DSLCreate(group.elements));
          case "ws":
            return createWhiteSpace();
        }
      }
    }

    if(options.elements) DSLCreate(options.elements);

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

export default ToolBar;
