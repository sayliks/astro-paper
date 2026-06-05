import { handleCallback } from "../../src/server/cmsAuth.js";

export default {
  fetch(request) {
    return handleCallback(request, process.env);
  },
};
