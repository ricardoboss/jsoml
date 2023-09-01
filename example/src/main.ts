import './style.css'
import { setupLoader } from "./loader.ts";

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <h1>JSOML Loader</h1>
    <div class="card">
      <button id="loader" type="button">Load</button>
    </div>
    <div class="card" id="content">
      This content will be replaced
    </div>
  </div>
`

setupLoader(
  document.querySelector<HTMLButtonElement>('#loader')!,
  document.querySelector<HTMLButtonElement>('#content')!
)
