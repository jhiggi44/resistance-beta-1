//Methods that I found useful to make DOM manipulation easier. 
exports.createElementWithTxt = function(typeOfElement, txtToAppend) {
    let element = document.createElement(`${typeOfElement}`);
    let txt = document.createTextNode(`${txtToAppend}`);

    element.appendChild(txt);
    return element;
}
exports.clearDiv= function(idOfDiv) {
    let div = document.getElementById(`${idOfDiv}`);
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}