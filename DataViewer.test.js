import { installDom } from "./test/dom-shim.js";

installDom();
const { DataViewer } = await import("./DataViewer.js");

function assert(value) {
  if (!value) {
    throw new Error("Expected value to be truthy");
  }
}

function assertEquals(actual, expected) {
  if (!Object.is(JSON.stringify(actual), JSON.stringify(expected))) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

Deno.test("renders array headers as inert text", async () => {
  installDom();

  const viewer = new DataViewer();
  viewer.data = [{ "<img src=x onerror=alert(1)>": "safe" }];

  const header = viewer.querySelector("th");
  assertEquals(header.textContent, "<img src=x onerror=alert(1)>");
  assertEquals(viewer.querySelector("img"), null);
});

Deno.test("renders object property names as inert text", async () => {
  installDom();

  const viewer = new DataViewer();
  viewer.data = { "<button onclick=alert(1)>": "safe" };

  const header = viewer.querySelector("th");
  assertEquals(header.textContent, "<button onclick=alert(1)>");
  assertEquals(viewer.querySelector("button"), null);
});

Deno.test("columns getter maps values from this.data", async () => {
  installDom();

  const viewer = new DataViewer();
  viewer.data = [
    { make: "Plymouth", year: 1958 },
    { make: "Dodge", year: 1964 },
  ];

  assertEquals(viewer.columns, {
    make: ["Plymouth", "Dodge"],
    year: [1958, 1964],
  });
});

Deno.test("selector ignores missing sources and copies already loaded data", async () => {
  installDom();

  const missingTarget = new DataViewer();
  missingTarget.attributeChangedCallback("selector", null, "#missing");
  assertEquals(missingTarget.data, undefined);

  const source = new DataViewer();
  source.id = "source";
  document.body.append(source);
  source.data = [{ a: 1 }];

  const target = new DataViewer();
  target.attributeChangedCallback("selector", null, "#source");

  assertEquals(target.data, [{ a: 1 }]);
});

Deno.test("selector receives future loaded data", async () => {
  installDom();

  const source = new DataViewer();
  source.id = "source";
  document.body.append(source);

  const target = new DataViewer();
  target.attributeChangedCallback("selector", null, "#source");

  source.data = [{ b: 2 }];
  source.dispatchEvent(new Event("loaded"));

  assertEquals(target.data, [{ b: 2 }]);
});

Deno.test("edit mode assigns input values without parsing HTML", async () => {
  installDom();

  const viewer = new DataViewer();
  viewer.data = [{ name: `"quoted" <b>text</b>` }];
  viewer.edit();

  const input = viewer.querySelector("input");
  assert(input);
  assertEquals(input.value, `"quoted" <b>text</b>`);
  assertEquals(viewer.querySelector("b"), null);
});
