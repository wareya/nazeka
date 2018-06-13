// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

// updated by a timer looping function, based on local storage set by the options page
// we only use a tiny number of settings here

let settings = {
reader_reverse: false
};

async function settings_init()
{
    try
    {
        async function getvar(name, defval)
        {
            let temp = (await browser.storage.local.get(name))[name];
            if(temp == undefined)
                temp = defval;
            settings[name] = temp;
        }
        getvar("reader_reverse", false);
    } catch(err) {} // options not stored yet
}

settings_init();

browser.storage.onChanged.addListener((updates, storageArea) =>
{
    if(storageArea != "local") return;
    for(let setting of Object.entries(updates))
    {
        let option = setting[0];
        let value = setting[1];
        if(Object.keys(settings).includes(option))
            settings[option] = value.newValue;
    }
});

// actual reder code

function might_have_japanese(text)
{
    for(let char of text)
        if(char && char.length > 0 && char.codePointAt(0) >= 0x2E80)
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
    
    if(!settings.reader_reverse)
        target.insertBefore(newnode, document.body.firstChild);
    else
        target.appendChild(newnode);
}

let text_previous = "";
function cycle_text(text)
{
    if(text != "" && text != text_previous)
        update(text);
    text_previous = text;
}

function gimmetext()
{
    browser.runtime.sendMessage({type:"gimmetext"});
}

let interval = 250;
async function checkpaste()
{
    try
    {
        let text = await gimmetext();
        cycle_text(text);
    }
    catch(error){}
    
    setTimeout(checkpaste, interval);
}
setTimeout(checkpaste, interval);

var executing = browser.tabs.executeScript({
    file: "/texthook.js",
    allFrames: true
});

browser.runtime.onMessage.addListener((req, sender, sendResponse) =>
{
    if (req.type == "text")
        cycle_text(req.text);
});
