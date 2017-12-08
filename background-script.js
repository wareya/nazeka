'use strict';

// We use JMdict converted to JSON. It's like 32MB so we don't want to load it for every tab.
// So we need to use a backgroudn script and send messages to it from the content script.
// Unfortunately webextensions don't have an easy way to load files even from in extension.
// We have to send an HTTP request and store the result in a string before parsing it into an object.
// Seriously.

let text = "";

function listener()
{
    if (this.readyState === 4)
    {
        if (this.status === 200)
            text = this.responseText;
        else
            console.error(xhr.statusText);
    }
}

let req = new XMLHttpRequest();
req.addEventListener("load", listener);
// FIXME: apparently this has to be in an async function now.
req.open("GET", browser.extension.getURL("dict/JMdict.json"), false);
req.send();

let dict = JSON.parse(text);
text = "";

// Build map of spellings to dictionary entry.

let lookup_kan = {};
let lookup_kana = {};

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

function search(text)
{
    if (lookup_kan[text])
    {
        //console.log("search successful (kanji)");
        return getfromdict(lookup_kan[text]);
    }
    else if (lookup_kana[text])
    {
        //console.log("search successful (kana)");
        return getfromdict(lookup_kana[text]);
    }
    else
    {
        //console.log("search failed");
        //console.log(text);
        return;
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type == 'search')
    {
        //console.log("running search");
        sendResponse(search(request.text));
    }
    else
    {
        //console.log("unhandled request");
        //return;
        return;
    }
});

