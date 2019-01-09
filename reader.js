// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

// updated by a timer looping function, based on local storage set by the options page
// we only use a tiny number of settings here

let reader_settings = {
reader_reverse: false,
reader_leeway: 200
};

async function reader_settings_init()
{
    try
    {
        async function getvar(name, defval)
        {
            let temp = (await browser.storage.local.get(name))[name];
            if(temp == undefined)
                temp = defval;
            reader_settings[name] = temp;
        }
        getvar("reader_reverse", false);
        getvar("reader_leeway", 200);
    } catch(err) {} // options not stored yet
}

reader_settings_init();

browser.storage.onChanged.addListener((updates, storageArea) =>
{
    if(storageArea != "local") return;
    for(let setting of Object.entries(updates))
    {
        let option = setting[0];
        let value = setting[1];
        if(Object.keys(reader_settings).includes(option))
            reader_settings[option] = value.newValue;
    }
});

// actual reder code

function reader_might_have_japanese(text)
{
    for(let char of text)
        if(char && char.length > 0 && char.codePointAt(0) >= 0x2E80)
            return true;
    return false;
}

function reader_update(text)
{
    if(!reader_might_have_japanese(text))
        return;
    
    let target = document.body;
    let newnode = document.createElement("p");
    newnode.textContent = text;
    
    if(!reader_settings.reader_reverse)
        target.insertBefore(newnode, document.body.firstChild);
    else
    {
        target.appendChild(newnode);
        
        if(reader_settings.reader_leeway != 0)
        {
            let scroll_end_distance = -document.body.scrollHeight + -document.body.clientHeight + 2*document.body.offsetHeight - document.body.scrollTop;

            if (scroll_end_distance < reader_settings.reader_leeway)
                window.scrollTo(0, document.body.scrollHeight);
        }
    }
    
    document.getElementById("linecount").innerText = parseInt(document.getElementById("linecount").innerText)+1;
}

let reader_text_previous = "";
function reader_cycle_text(text)
{
    if(text != "" && text != reader_text_previous)
        reader_update(text);
    reader_text_previous = text;
}

function reader_gimmetext()
{
    browser.runtime.sendMessage({type:"gimmetext"});
}

let interval = 250;
async function reader_checkpaste()
{
    try
    {
        let text = await reader_gimmetext();
        reader_cycle_text(text);
    }
    catch(error){}
    
    setTimeout(reader_checkpaste, interval);
}
setTimeout(reader_checkpaste, interval);

browser.runtime.onMessage.addListener((req, sender) =>
{
    if (req.type == "text")
        reader_cycle_text(req.text);
    return Promise.resolve(undefined);
});
