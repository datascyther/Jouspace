export const EventEmitter = class {
  addListener() {
    return { remove: () => {} };
  }
  removeListener() {}
  removeAllListeners() {}
  emit() {}
  listenerCount() {
    return 0;
  }
};
export default EventEmitter;
