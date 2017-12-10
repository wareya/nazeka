// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

// We use JMdict converted to JSON. It's like 32MB so we don't want to load it for every tab.
// So we need to use a background script and send messages to it from the content script.
// Unfortunately webextensions don't have an easy way to load files, even from in the extension.
// We have to send an HTTP request and store the result in a string before parsing it into an object.
// Seriously.

let dict = undefined;
let lookup_kan = {};
let lookup_kana = {};

function builddict()
{
    if (this.readyState === 4)
    {
        if (this.status === 200)
        {
            dict = JSON.parse(this.responseText);
            
            // Build map of spellings to dictionary entry.


            for (let i = 0; i < dict.length; i++)
            {
                let entry = dict[i];
                if (entry.k_ele != undefined) for (let j = 0; j < entry.k_ele.length; j++)
                {
                    let s = entry.k_ele[j];
                    if (lookup_kan[s.keb] == undefined)
                        lookup_kan[s.keb] = [i];
                    else
                        lookup_kan[s.keb].push(i);
                }
                for (let j = 0; j < entry.r_ele.length; j++)
                {
                    let s = entry.r_ele[j];
                    if (lookup_kana[s.reb] == undefined)
                        lookup_kana[s.reb] = [i];
                    else
                        lookup_kana[s.reb].push(i);
                }
            }
            for (let i = 0; i < 5; i++)
            {
                console.log(dict[i]);
            }
            console.log("built lookup tables");
            console.log("size:");
            console.log(Object.keys(lookup_kan).length);
            console.log(Object.keys(lookup_kana).length);
            console.log("dict size:");
            console.log(dict.length);
        }
        else
            console.error(xhr.statusText);
    }
}
let req = new XMLHttpRequest();
req.addEventListener("load", builddict);
// FIXME: apparently this has to be in an async function now.
req.open("GET", browser.extension.getURL("dict/JMdict.json"));
req.send();

// In JMdict, part-of-speech tags are XML entities.
// We processed JMdict's XML with entity processing disabled so we can just use the bare tags (e.g. "v1", not "ichidan verb").
// This left the entity syntax &this; behind so we want to cut it off when we return results.
function clip(str)
{
    if(str == undefined)
        return;
    if(str.length <= 2)
        return "";
    return str.substring(1, str.length-1);
}

function getfromdict(indexes)
{
    let ret = [];
    for(let i = 0; i < indexes.length; i++)
    {
        let entry = dict[indexes[i]];
        let lastpos = [];
        // JMdict tags part-of-speech for senses sparsely
        // e.g. if 1. and 2. share the same list of POSs, only 1. will have a POS list
        // undoing this here makes things in the content script WAY less inconvenient
        for(let j = 0; j < entry.sense.length; j++)
        {
            if(entry.sense[j].pos)
            {
                for(let t = 0; t < entry.sense[j].pos.length; t++)
                {
                    if(entry.sense[j].pos[t].charAt(0)=="&")
                        entry.sense[j].pos[t] = clip(entry.sense[j].pos[t]);
                }
            }
            else
                entry.sense[j].pos = lastpos;
            lastpos = entry.sense[j].pos;
        }
        ret.push(entry);
    }
    return ret;
}

function replace_hira_with_kata(text)
{
    let newtext = "";
    for(let i = 0; i < text.length; i++)
    {
        let codepoint = text.codePointAt(i);
        if(codepoint >= 0x3040 && codepoint <= 0x309F)
            codepoint += (0x30A0 - 0x3040);
        newtext += String.fromCodePoint(codepoint);
    }
    return newtext;
}

function replace_kata_with_hira(text)
{
    let newtext = "";
    for(let i = 0; i < text.length; i++)
    {
        let codepoint = text.codePointAt(i);
        if(codepoint >= 0x30A0 && codepoint <= 0x30FF)
            codepoint -= (0x30A0 - 0x3040);
        newtext += String.fromCodePoint(codepoint);
    }
    return newtext;
}

function search_inner(text)
{
    if (lookup_kan[text])
        return getfromdict(lookup_kan[text]);
    else if (lookup_kana[text])
        return getfromdict(lookup_kana[text]);
    else
        return;
}

function search(text)
{
    let ret = undefined;
    ret = search_inner(text);
    if(ret) return ret;
    ret = search_inner(replace_hira_with_kata(text));
    if(ret) return ret;
    ret = search_inner(replace_kata_with_hira(text));
    if(ret) return ret;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) =>
{
    if (request.type == 'search')
    {
        sendResponse(search(request.text));
    }
    else
    {
        return;
    }
});

async function update_icon(enabled)
{
    if(enabled)
    {
        browser.browserAction.setIcon({path:{
            "16": "enabled16.png",
            "32": "enabled32.png",
            "512": "enabled512.png"
        }},)
    }
    else
    {
        browser.browserAction.setIcon({path:{
            "16": "action16.png",
            "32": "action32.png",
            "512": "action512.png"
        }},)
    }
}

async function toggle_enabled()
{
    let enabled = (await browser.storage.local.get("enabled")).enabled;
    if(enabled == undefined)
        enabled = false;
    enabled = !enabled;
    browser.storage.local.set({enabled: enabled});
    update_icon(enabled);
}

async function init_icon()
{
    browser.browserAction.onClicked.addListener(toggle_enabled);
    let enabled = (await browser.storage.local.get("enabled")).enabled;
    if(enabled == undefined)
        enabled = false;
    update_icon(enabled);
}

init_icon();



