# data-viewer
A simple table visualizer for JSON data. A web component.


There are currently three ways to use the `<data-viewer>` web component:

## Add `JSON` data directly inside the `HTML` markup of the component instance

```html
<data-viewer>
[{"a": 1, "b": 2}, {"a": 10, "b": 20}]
</data-viewer>
```

Which will look something like this:

<table class="array-of-objects"><thead><tr><th data-header="a">a</th><th data-header="b">b</th></tr></thead><tbody><tr><td data-header="a">1</td><td data-header="b">2</td></tr><tr><td data-header="a">10</td><td data-header="b">20</td></tr></tbody></table>


## Use the `src` attribute to a `JSON` file

You can render an external `JSON` file via the `src` attribute, like this:

```html
<data-viewer src="interesting-data.json"></data-viewer>
```

Which will of course depend on whatever’s in the file `interesting-data.json`.

## Set data directly via Javascript by assigning to the `.data` property

If you get a reference to a `<data-viewer>` element, you can set data directly, like this:

```html
<data-viewer id=boss-car>
</data-viewer>

<script type=module>
import {DataViewer} from './DataViewer.js'

let carDetails = {
  "year": 1958,
  "make": "Plymouth",
  "model": "Belvedere",
  "features": [
    "4 door",
    "radio",
    "heater",
    "automatic transmission",
    "31000 miles",
    "like new"
  ]
}

let bossCarDataViewer = document.querySelector('#boss-car')
bossCarDataViewer.data = carDetails
</script>
```

<table class="object"><tr>
        <th>year</th>
        <td data-header="year">1958</td>
      </tr><tr>
        <th>make</th>
        <td data-header="make">Plymouth</td>
      </tr><tr>
        <th>model</th>
        <td data-header="model">Belvedere</td>
      </tr><tr>
        <th>features</th>
        <td data-header="features"><table class="array-of-simple-values"><tbody><tr><td>4 door</td></tr><tr><td>radio</td></tr><tr><td>heater</td></tr><tr><td>automatic transmission</td></tr><tr><td>31000 miles</td></tr><tr><td>like new</td></tr></tbody></table></td>
      </tr></table>


GitHub’s `CSS` makes the tables look a bit kooky here.

It’s much easier to just try out the demo here:


[demo](demo.html)

There is some very not-done documentation which will hopefully get better here:

[data-viewer.html](data-viewer.html)
