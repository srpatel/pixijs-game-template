import App from "./App";

document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  document.body.appendChild(app.view);

  app.setSize(window.innerWidth, window.innerHeight);
  window.addEventListener("resize", () => {
    app.setSize(window.innerWidth, window.innerHeight);
  });
});
