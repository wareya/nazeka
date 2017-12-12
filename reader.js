function toggle()
{
    browser.runtime.sendMessage({type:"toggle"});
}

browser.contextMenus.create({
    id: "nazeka-toggle",
    title: "Toggle Nazeka",
    contexts: ["all"],
    onclick: toggle
});

function might_have_japanese(text)
{
    for(let char of text)
        if(char && char.length > 0 && char.codePointAt(0) > 0x2E80)
            return true;
    return false;
}

function update(text)
{
    if(!might_have_japanese(text))
        return;
    
    let target = document.body;
    let newnode = document.createElement("p");
    newnode.textContent = text;
    
    target.insertBefore(newnode, document.body.firstChild);
}

let text_previous = "";
function cycle_text(text)
{
    if(text != "" && text != text_previous)
        update(text);
    text_previous = text;
}

window.addEventListener("load", () =>
{
    document.querySelector("#nazeka-paste-target").addEventListener("paste", (event) =>
    {
        // skip event if there's no plaintext; thanks github.com/kmltml/clipboard-inserter
        let text = event.clipboardData.getData("text/plain");
        if(text !== "")
            cycle_text(text);
        
        event.preventDefault();
    })
});

function checkpaste()
{
    let target = document.querySelector("#nazeka-paste-target");
    
    target.parentNode.style.visibility = "visible";
    
    target.textContent = "";
    target.focus();
    document.execCommand("paste");
    
    target.parentNode.style.visibility = "hidden";
}

let interval = 250;

setInterval(checkpaste, interval);

var executing = browser.tabs.executeScript({
    file: "/texthook.js",
    allFrames: true
});
