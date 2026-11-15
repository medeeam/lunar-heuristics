import application from '../dist/server/index.js';

export default {
  fetch(request) {
    return application.fetch(request);
  }
};
