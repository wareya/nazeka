// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

function reset()
{
    browser.storage.local.set({cards:[]});
    document.body.querySelector("#field").textContent = "";
    document.body.querySelector("#reset").value = "Reset";
    document.body.querySelector("#reset").addEventListener("click", ask_reset);
}

function ask_reset()
{
    document.body.querySelector("#reset").value = "Click again to make Nazeka to forget ALL your mined words.";
    document.body.querySelector("#reset").addEventListener("click", reset);
}

async function init_page()
{
    let data = (await browser.storage.local.get("cards")).cards;
    if(data)
    {
        let text = "";
        for(let card of data)
        {
            text += card.front.replace("\t", "\\t");
            text += "\t";
            text += card.readings.replace("\t", "\\t");
            text += "\t";
            text += card.definitions.replace("\t", "\\t");
            text += "\t";
            try
            {   text += card.lookup.replace("\t", "\\t");
                text += "\t";
            } catch(e) {}
            try
            {   text += card.sentence.replace("\t", "\\t");
                text += "\t";
            } catch(e) {}
            try
            {   text += card.index.replace("\t", "\\t");
                text += "\t";
            } catch(e) {}
            text += card.seq.replace("\t", "\\t");
            text.replace("\n", "\\n").replace("\r", "");
            text += "\n";
        }
        let element = document.body.querySelector("#field");
        element.textContent = text;
    }
    document.body.querySelector("#reset").addEventListener("click", ask_reset);
}

if (document.readyState == "complete")
    init_page();
else
    document.addEventListener("DOMContentLoaded", init_page);

