import Raven from "raven-js";

function init() {
  Raven.config(
    "https://e93d6c0896a742538b74a0638780bcc9@o4504537371705344.ingest.sentry.io/4504537378783232",
    {
      release: "1-0-0",
      environment: "vidly-frontend-dev",
    }
  ).install();
}

function log(error) {
  //console.log(error);
  Raven.captureException(error);
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  init,
  log,
};
