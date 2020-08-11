import "./toolbar.css"
import Control from "ol/control/Control"

export var ToolBar = /*@__PURE__*/(function (Control) {
  function ToolBar(event, opt_options) {
    const options = opt_options || {};


    const element = document.createElement('div');
    element.className = 'toolbar ol-unselectable ol-control';

    let createButton = (text, handler, hint) => {
      let btn = document.createElement('button');
      if(hint) btn.setAttribute("title", hint);
      btn.className = 'tool';
      btn.innerHTML = text;
      btn.addEventListener("click", handler.bind(btn), false);
      element.appendChild(btn);
    };

    let createWhiteSpace = () => {
      let ws = document.createElement('div');
      ws.className = "whitespace";
      ws.innerHTML = "";
      element.appendChild(ws);
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
      if(this.className === "tool") this.className = "tool active";
      else this.className = "tool";
    }, "吸附");
    createWhiteSpace();
    createButton("A", () => {
      event.emit("area");
    }, "生成区域");
    createWhiteSpace();
    createButton("O", () => {
      event.emit("optimize");
    }, "提交路径优化");
    createButton("D", () => {
      event.emit("dispatch");
    }, "提交调度");
    createButton("M", () => {
      event.emit("map");
    }, "提交图块信息");

    Control.call(this, {
      element: element,
      target: options.target,
    });
  }

  if ( Control ) ToolBar.__proto__ = Control;
  ToolBar.prototype = Object.create( Control && Control.prototype );
  ToolBar.prototype.constructor = ToolBar;

  return ToolBar;
}(Control));
