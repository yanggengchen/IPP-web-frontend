export function mixto(target, ...args) {
    args.forEach(item => {
      for(let key in item) {
        target[key] = item[key];
      }
    })
  }
