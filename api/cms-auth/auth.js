import { handleAuth } from "../../src/server/cmsAuth.js";

export default {
  fetch(request) {
    return handleAuth(request, process.env);
  },
};
