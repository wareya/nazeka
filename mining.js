// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

function reset()
{
    browser.storage.local.set({cards:[]});
    document.body.querySelector("#reset").textContent = "";
}

async function init_page()
{
    let data = (await browser.storage.local.get("cards")).cards;
    console.log(data);
    let text = "";
    for(let card of data)
    {
        text += card.front.replace("\t", "\\t");
        text += "\t";
        text += card.readings.replace("\t", "\\t");
        text += "\t";
        text += card.definitions.replace("\t", "\\t");
        text += "\t";
        text += card.seq.replace("\t", "\\t");
        text += "\n";
    }
    let element = document.body.querySelector("#field");
    element.textContent = text;
    
    document.body.querySelector("#reset").addEventListener("click", reset);
}

if (document.readyState == "complete")
    init_page();
else
    document.addEventListener("DOMContentLoaded", init_page);

