# JSOML - Javascript Object Markup Language

JSOML is a markup language that allows you to write HTML as JSON objects.

## Schema

```json
{
    "div": {
        "p": "Hello World!",
        "a": {
            "$href": "https://github.com",
            "$text": "Github"
        }
    }
}
```

Will be rendered as:

```html
<div>
    <p>Hello World!</p>
    <a href="https://github.com">Github</a>
</div>
```

You can put any HTML tag as a key, and the value can be a string or an object.
Attributes need to be prefixed with a `$` sign.

Order matters!
If you put a `$text` attribute after other children, they will be replaced by the text:

```json
{
    "div": {
        "p": "Hello World!",
        "a": {
            "$href": "https://github.com",
            "$text": "Github"
        },
        "$text": "This will replace the other children!"
    }
}
```

Will be rendered as:

```html
<div>This will replace the other children!</div>
```

## Usage

```typescript
import { render } from "jsoml";

const html = render(/* JSOML object */);

document.body.innerHTML = html.toString();
```

## License

This project is licensed under the MIT License.
See the [LICENSE](./LICENSE.md) file for details.
