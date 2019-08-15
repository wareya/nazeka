// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

// we only use a tiny number of settings here

let reader_settings = {
reader_reverse: false,
reader_leeway: 200,
reader_bg: "#111111",
reader_fg: "#CCCCCC",
reader_fg_old: "#B0B0B0",
reader_font_size: "1.4em",
reader_right_padding: "0px",
reader_max_width: "1000px",
reader_margin: "8px",
reader_font: "",
reader_auto: false,
reader_throttle: 200,
reader_convert_newlines: false
};

function update_styles()
{
    let target = document.body.style;
    target.backgroundColor = reader_settings.reader_bg;
    target.color = reader_settings.reader_fg_old;
    target.fontSize = reader_settings.reader_font_size;
    target.paddingRight = reader_settings.reader_right_padding;
    target.maxWidth = reader_settings.reader_max_width;
    target.marginLeft = reader_settings.reader_margin;
    target.marginRight = reader_settings.reader_margin;
    target.fontFamily = reader_settings.reader_font;
    let target2 = document.querySelector("#new_color_style");
    let elements = document.body.getElementsByTagName("p");
    let which = String(reader_settings.reader_reverse ? elements.length : 1);
    target2.textContent = `body > p:nth-of-type(${which})
{
    color: ${reader_settings.reader_fg};
}`;
    console.log("attempted to update styles");
    console.log(target2.textContent);
    console.log(which);
    console.log(reader_settings.reader_reverse);
}

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
        getvar("reader_bg", "#111111");
        getvar("reader_fg", "#CCCCCC");
        getvar("reader_fg_old", "#B0B0B0");
        getvar("reader_font_size","1.4em");
        getvar("reader_right_padding", "0px");
        getvar("reader_max_width", "1000px");
        getvar("reader_margin", "8px");
        getvar("reader_font", "");
        getvar("reader_auto", false);
        getvar("reader_throttle", 200);
        getvar("reader_convert_newlines", false);
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
    update_styles();
});

// actual reder code

function reader_might_have_japanese(text)
{
    for(let char of text)
        if(char && char.length > 0 &&
            (char.codePointAt(0) >= 0x2E80 || char === "…"))
            return true;
    return false;
}

function reader_update(text)
{
    if(!reader_might_have_japanese(text))
        return;
    let target = document.body;
    let newnode = document.createElement("p");
    newnode.className = "nazeka_reader_insertion";
    if(reader_settings.reader_convert_newlines)
    {
        newnode.textContent = "";
        for(let line of text.split("\n"))
        {
            newnode.appendChild(document.createTextNode(line));
            newnode.appendChild(document.createElement("br"));
        }   
    }
    else
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
    
    let x = newnode.getBoundingClientRect().x - document.documentElement.getBoundingClientRect().x;
    let y = newnode.getBoundingClientRect().y - document.documentElement.getBoundingClientRect().y;
    y += Math.min(5, newnode.getBoundingClientRect().height/2);
    
    if(reader_settings.reader_auto)
        send_lookup_request(x, y, text);
}

async function send_lookup_request(x, y, text)
{
    let id = (await browser.tabs.getCurrent()).id;
    browser.runtime.sendMessage({id:id, type:"reader_lookup", x:x, y:y, text:text});
}

async function send_reader_mode(x, y, text)
{
    let id = (await browser.tabs.getCurrent()).id;
    browser.runtime.sendMessage({id:id, type:"reader_mode"});
}

let reader_text_previous = "";
function reader_cycle_text(text)
{
    if(document.getElementById("button_pause").innerText != "Pause")
        return;
    if(text != "" && text != reader_text_previous)
    {
        reader_update(text);
        update_styles();
    }
    reader_text_previous = text;
}

function reader_gimmetext()
{
    browser.runtime.sendMessage({type:"gimmetext"});
}

async function reader_checkpaste()
{
    try
    {
        let text = await reader_gimmetext();
        reader_cycle_text(text);
    }
    catch(error){}
    
    setTimeout(reader_checkpaste, reader_settings.reader_throttle);
}
setTimeout(reader_checkpaste, reader_settings.reader_throttle);

browser.runtime.onMessage.addListener((req, sender) =>
{
    if (req.type == "text")
        reader_cycle_text(req.text);
    return Promise.resolve(undefined);
});

function toggle_pause()
{
    let target = document.getElementById("button_pause");
    if(target.innerText == "Pause")
        target.innerText = "Unpause";
    else
        target.innerText = "Pause";
}

function delete_newest()
{
    let elements = document.getElementsByTagName("p");
    let which = reader_settings.reader_reverse ? elements.length-1 : 0;
    let target = document.getElementsByTagName("p")[which];
    if(target.className == "nazeka_reader_insertion")
    {
        target.remove();
        document.getElementById("linecount").innerText = parseInt(document.getElementById("linecount").innerText)-1;
    }
}

window.onload = () =>
{
    send_reader_mode();
    update_styles();
    document.getElementById("button_pause").onclick = toggle_pause;
    document.getElementById("button_delete").onclick = delete_newest;
}
