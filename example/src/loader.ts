import renderInto from "../../src";

export function setupLoader(element: HTMLButtonElement, target: HTMLElement) {
  const setContent = async () => {
    const response = await fetch('/content.jsoml', {
      headers: {
        'Accept': 'application/json+jsoml'
      }
    });

    const jsoml = await response.json();

    renderInto(target, jsoml);
  }

  element.addEventListener('click', setContent);
}