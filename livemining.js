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
        "livemining_host": document.querySelector("#host").value
    };
    console.log(setstuff);
    browser.storage.local.set(setstuff);
}

function loadConfig()
{
    let promise = browser.storage.local.get(["livemining_deckname", "livemining_modelname", "livemining_fields", "livemining_host"]);
    promise.then((storage) => 
    {
        if(storage["livemining_deckname"] !== undefined)
            document.querySelector("#deckname").value = storage["livemining_deckname"];
        if(storage["livemining_modelname"] !== undefined)
            document.querySelector("#modelname").value = storage["livemining_modelname"];
        if(storage["livemining_host"] !== undefined)
            document.querySelector("#host").value = storage["livemining_host"];
        reset_fields();
        for(let pair of storage["livemining_fields"])
            add_field(pair[0], pair[1]);
    }, (e) => {console.log(e);});
}


function buildpage()
{
    document.getElementById("autofields").onclick = function(e)
    {
        let host = document.getElementById("host").value;

        let request = JSON.parse(`
        {"action":"modelFieldNames",
         "version":6,
         "params": {"modelName":"Basic"}
        }`);
        request["params"]["modelName"] = document.getElementById("modelname").value;
        
        let json = JSON.stringify(request);
        console.log(json);
        
        let xhr = new XMLHttpRequest();
        xhr.open("POST", host, true);
        //xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
        xhr.addEventListener('load', () =>
        {
            let response = JSON.parse(xhr.responseText);
            if (response["result"])
            {
                reset_fields();
                for(let fieldname of response["result"])
                    add_field(fieldname);
            }
        });
        xhr.send(json);
 
        e.preventDefault();
    };
    
    document.getElementById("applyfields").onclick = saveConfig;
    
    loadConfig();
    
    document.getElementById("loadfields").onclick = loadConfig;
}
if (document.readyState == "complete")
{
    buildpage();
}
else
{
    document.addEventListener("DOMContentLoaded", buildpage);
}
