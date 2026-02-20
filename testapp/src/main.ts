import "./style.css";
import { AppController } from "./app/appController";

const app = document.querySelector("#app");
if (app) {
  app.innerHTML = `
    <div class="card">
      <h1>EvenHub TestApp</h1>
      <p>Bridge wird initialisiert. Details im Console-Log.</p>
    </div>
  `;
}

const controller = new AppController();
controller.start();
