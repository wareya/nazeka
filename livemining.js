'use strict';

function reset_fields()
{
    document.getElementById("containfields").innerHTML = "";
}

function add_option(input, text, selected=false)
{
    let option = document.createElement("option");
    option.value = text;
    option.innerText = text;
    option.selected = selected;
    input.appendChild(option);
}

function add_options(input, preselect="")
{
    let list = [
    "nothing",
    
    "found_spelling",
    "readings",
    
    "definitions",
    "definitions_raw",
    
    "found_text",
    "context",
    "context_left",
    "context_right",
    
    "audio_anki",
    "audio_kanji",
    "audio_reading",
    
    "jmdict_id",
    "url",
    "page_title",
    "time_unix",
    "time_local",
    
    "readings_raw",
    "spellings_raw",
    ];
    
    for (let ident of list)
    {
        add_option(input, ident, (ident == preselect));
    }
}

function get_fields()
{
    let mappings = new Map();
    for(let element of document.querySelectorAll("#containfields > div"))
    {
        console.log(element);
        mappings.set(element.querySelector("label").innerText, element.querySelector("select").value);
    }
    return mappings;
}

function add_field(fieldname, preselect="")
{
    let div = document.createElement("div");
    let input = document.createElement("select");
    input.id = fieldname;
    add_options(input, preselect);
    let label = document.createElement("label");
    label.for = fieldname;
    label.innerText = fieldname;
    div.appendChild(input);
    div.appendChild(label);
    document.getElementById("containfields").appendChild(div);
}

var __host = "http://127.0.0.1:8765";

function saveConfig()
{
    let mappings = new Array();
    for(let element of document.querySelectorAll("#containfields > div"))
    {
        console.log(element);
        mappings.push([element.querySelector("label").innerText, element.querySelector("select").value]);
    }
    console.log(mappings);
    let setstuff =
    {
        "livemining_deckname": document.querySelector("#deckname").value,
        "livemining_modelname": document.querySelector("#modelname").value,
        "livemining_fields": mappings,
    };
    console.log(setstuff);
    browser.storage.local.set(setstuff);
}

function loadConfig()
{
    let promise = browser.storage.local.get(["livemining_deckname", "livemining_modelname", "livemining_fields"]);
    promise.then((storage) => 
    {
        if(storage["livemining_deckname"] !== undefined)
            document.querySelector("#deckname").value = storage["livemining_deckname"];
        if(storage["livemining_modelname"] !== undefined)
            document.querySelector("#modelname").value = storage["livemining_modelname"];
        reset_fields();
        if(storage["livemining_fields"] !== undefined)
            for(let pair of storage["livemining_fields"])
                add_field(pair[0], pair[1]);
    }, (e) => {console.log(e);});
}


function buildpage()
{
    document.getElementById("autofields").onclick = (e) =>
    {
        let request = JSON.parse(`
        {"action":"modelFieldNames",
         "version":6,
         "params": {"modelName":"Basic"}
        }`);
        request["params"]["modelName"] = document.getElementById("modelname").value;
        
        let json = JSON.stringify(request);
        console.log(json);
        
        let xhr = new XMLHttpRequest();
        xhr.open("POST", __host, true);
        //xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
        xhr.addEventListener('load', () =>
        {
            let response = JSON.parse(xhr.responseText);
            if (response.result)
            {
                let old_fields = get_fields();
                reset_fields();
                for(let fieldname of response.result)
                {
                    let old = old_fields.get(fieldname);
                    if(old !== undefined)
                        add_field(fieldname, old);
                    else
                        add_field(fieldname);
                }
            }
            else
            {
                errormessage(response.error);
            }
        });
        xhr.addEventListener('error', () =>
        {
            errormessage("AnkiConnect messaging failed: unspecified error (Anki is probably not open)");
        });
        xhr.addEventListener('timeout', () =>
        {
            errormessage("AnkiConnect messaging failed: timed out");
        });
        xhr.send(json);
 
        e.preventDefault();
    };
    
    document.getElementById("applyfields").onclick = saveConfig;
    
    loadConfig();
    
    document.getElementById("loadfields").onclick = loadConfig;
    
    document.getElementById("upgrade").onclick = (e) =>
    {
        let json = `
        {"action":"upgrade",
         "version":6
        }`;
        let xhr = new XMLHttpRequest();
        xhr.open("POST", __host, true);
        xhr.send(json);
        xhr.addEventListener('load', () =>
        {
            let response = JSON.parse(xhr.responseText);
            if (!response.result)
            {
                errormessage(response.error);
            }
        });
        xhr.addEventListener('error', () =>
        {
            errormessage("AnkiConnect messaging failed: unspecified error (Anki is probably not open)");
        });
        xhr.addEventListener('timeout', () =>
        {
            errormessage("AnkiConnect messaging failed: timed out");
        });
        e.preventDefault();
    };
}
if (document.readyState == "complete")
{
    buildpage();
}
else
{
    document.addEventListener("DOMContentLoaded", buildpage);
}


function errormessage(text)
{
    if(!text) return;
    let mydiv = document.createElement("div");
    mydiv.style = "background-color: #111; color: #CCC; font-family: Arial, sans-serif; font-size: 13px; width: 300px; border: 3px double red; position: fixed; right: 25px; top: 25px; z-index: 1000000000000000000000; padding: 5px; border-radius: 3px;"
    mydiv.textContent = text;
    document.body.appendChild(mydiv);
    
    function delete_later()
    {
        mydiv.remove();
    }
    
    setTimeout(delete_later, 3000);
}
