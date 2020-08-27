import EventEmitter from "events"

const Dialog = (function() {
  class Dialog extends EventEmitter {
    constructor() {
      super();
      this.component = undefined;
      this.arguments = {};
      this.on("close", () => {
        this.onclose();
      });
      this.show = false;
    }

    register(component) {
      this.component = component;
    }

    trigger(args = {}) {
      this.arguments = args;
      this.show = true;
      this.emit("show");
    }

    close() {
      this.show = false;
      this.emit("close");
    }

    onclose() {
      this.show = false;
    }
  }
  return Dialog;
})()

export default Dialog;
