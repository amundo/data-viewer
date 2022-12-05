
let identifyType = x => { 
  let type = Object.prototype.toString.call(x)
    .toLowerCase()
    .split(' ')
    [1]
    .slice(0, -1)
  return type
}

let unique = items => Array.from(new Set(items))

let renderArrayOfSimpleValues = array => {
  let table = document.createElement("table")
  let tbody = document.createElement("tbody")
  table.append(tbody)
  table.classList.add('array-of-simple-values')
  
  array.forEach(item => {
    let tr = document.createElement("tr")
    let td = document.createElement("td")
    td.append(render(item))
    tr.append(td)
    tbody.append(tr)
  })

  return table
}

let renderArray = array => {
  if(array.every(item => identifyType(item) == 'object')){
    return renderArrayOfObjects(array)
  } else {
    return renderArrayOfSimpleValues(array)
  }
}

let renderArrayOfObjects = (array, headers=null) => {
  let table = document.createElement("table")
  let thead = document.createElement("thead")
  let tbody = document.createElement("tbody")
  
  table.classList.add('array-of-objects')

  table.append(thead)
  table.append(tbody)

  headers = headers || unique(array.map(item => Object.keys(item)).flat())
  
  thead.innerHTML = headers.map(header => 
    `<th data-header="${header}">${header}</th>`
    ).join("")

  array.forEach(datum => {
    let tr = document.createElement("tr")
    headers.forEach(header => {
      let value = (header in datum) ? datum[header] : ""
      let td = document.createElement("td")
      td.dataset.header = header
      td.append(render(value))
      tr.append(td)
    })
    tbody.append(tr)
  })

  return table
}

let renderObject = object => {
  let table = document.createElement("table")

  table.classList.add('object')

  Object.entries(object)
    .forEach(([key,value]) => {
      let tr = document.createElement("tr")
      tr.innerHTML = `
        <th>${key}</th>
        <td data-header="${key}"></td>
      `
      tr.querySelector("td").append(render(value))
      table.append(tr)
  })
  return table
}

let renderString = string => {
  if(string.startsWith("http") || string.startsWith("file")){
    let a = document.createElement("a")
    a.textContent = string
    a.href = string
    a.target = '_blank'
    return a
  } else {
    return string
  }
}

let render = data => {
  let type = identifyType(data)
  switch (type) {
    case "array":
      return renderArray(data)
      break;
    case "object":
      return renderObject(data)
      break;
    case "string":
      return renderString(data)
      break;
    case "number":
      return data
      break;
    case "boolean":
      return data
      break;
    default:
      return data
      break;
  }
}

class DataViewer extends HTMLElement {
  constructor(){
    super()
    this.listen()
  }

  connectedCallback() {
    if(this.textContent.trim().length){
      try {
        this.data = JSON.parse(this.textContent)
      } catch(error){

      }
    }
  }

  static get observedAttributes(){
    return ['src', 'root', 'caption', 'headers', 'selector', 'show-source']
  }

  attributeChangedCallback(attribute, oldValue, newValue){
    if(attribute == 'show-source'){
      this.classList.add('show-source')
      this.showSource = true
    }
    
    if(attribute == 'root'){
      this.root = newValue
    }
    
    if(attribute == 'src'){
      this.fetch(newValue)
    }
    
    if(attribute == 'selector'){
      let sourceElement = document.querySelector(newValue)
      sourceElement.addEventListener('loaded', e => {
        this.data = sourceElement.data
      })
    }

    if(attribute == 'caption'){
      this.caption= newValue
    }

    if(attribute == 'headers'){ 
      this.headers = newValue.split(/[ ,]+/g).filter(Boolean)
    }

  }

  get columns(){
    let keys = Object.keys(this.data[0])
    return keys.reduce((columns,key) => {
      columns[key] = data.map(datum => 
        datum[key])
      return columns
    }, {}
    )
  }

  get uniqueColumns(){
    let columns = this.columns
    return Object.fromEntries(Object.entries(columns).map(([property,column]) =>
      [property, [...new Set(column)]]
    ))
  }
  
  get properties(){
    return Object.keys(this.data[0])
  }

  async fetch(src){
    let response = await fetch(src)
    let data = await response.json()
    if(this.root){
      data = data[this.root]
    }
    this.data = data
    this.innerHTML = ``
    this.dispatchEvent(new Event('loaded'))
    this.render()
  }

  edit(){
    this.querySelectorAll('td[data-header]').forEach(td => {
      td.innerHTML = `<input value="${td.textContent}" />`
    })
  }

  read(){
    let trs = Array.from(this.querySelectorAll('table tbody tr'))
    
    return trs.map(tr => {
      let cells = Array.from(tr.cells)
      return cells.reduce((object, td) => {
        object[td.dataset.header] = td.querySelector('input').value
        return object
      }, {})
    })
  }

  // duplicate a column into a new column with a new name
  // helpful when two fields have similar content
  copyFieldAs(sourceFieldName, targetFieldName){  
    let dataCopy = this.data.slice()
    dataCopy.forEach(datum => {
      if(!datum[sourceFieldName]){
        return
      }
      datum[targetFieldName] = datum[sourceFieldName]
    })
    this.data = dataCopy
  }

  render() { 
    this.innerHTML = `` 

    this.append(render(this._data))
    // this.insertAdjacentHTML('beforeend',`<header><a href="#">JSON</a></header>`)

    if(this.caption){
      let caption = document.createElement('caption')
      caption.textContent = this.caption
      this.querySelector('table').append(caption)
    }

    if(this.showSource){
      let pre = document.createElement('pre')
      pre.textContent = JSON.stringify(this.data,null,2)
      this.insertAdjacentElement('beforeend', pre)
    }

    let renderedDataViewerEvent = new CustomEvent('rendered-data-viewer', {bubbles:true})
    this.dispatchEvent(renderedDataViewerEvent)

  }

  set data(data) { 
    this._data = data
    this.render()
  }

  get data() {
    return this._data
  }

  listen(){
    this.addEventListener('click', clickEvent => {
      if(clickEvent.metaKey && 
        clickEvent.target.matches('.array-of-objects th')){
          let columnHeader = clickEvent.target.dataset.header
          this.querySelectorAll(`[data-header="${columnHeader}"]`)
            .forEach(t => t.hidden = true)
      }
    })
  }
}

customElements.define('data-viewer', DataViewer)

Object.assign(window, {
  // identifyType,
  // unique,
  // render,
  // renderArrayOfSimpleValues,
  // renderArrayOfObjects,
  // renderObject,
  DataViewer
})

export {
  // identifyType,
  // unique,
  // render,
  // renderArrayOfSimpleValues,
  // renderArrayOfObjects,
  // renderObject,
  DataViewer
}