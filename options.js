// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

let settings = [];

function defaults()
{
    // behavior
    settings.push({
        kind: "dummy",
        label: "Behavior"
    });
    
    settings.push({
        id: "enabled",
        kind: "checkbox",
        default: false,
        label: "Enabled"
    });
    settings.push({
        id: "compact",
        kind: "checkbox",
        default: true,
        label: "Compact"
    });
    settings.push({
        id: "showoriginal",
        kind: "checkbox",
        default: true,
        label: "Show original text"
    });
    settings.push({
        id: "popup_follows_mouse",
        kind: "checkbox",
        default: true,
        label: "Popup follows mouse (even if it doesn't update)"
    });
    settings.push({
        id: "length",
        kind: "number",
        min: 6,
        max: 100,
        step: 1,
        default: 25,
        label: "Search length (characters) (default 25, sane values are from 25 to 50)"
    });
    settings.push({
        id: "lookuprate",
        kind: "number",
        min: 1,
        max: 1000,
        step: 1,
        default: 8,
        label: "Lookup throttle (milliseconds)"
    });
    settings.push({
        id: "alternatives_mode",
        kind: "combobox",
        options: ["Longest match only", "Longest and shortest match", "Longest and second longest match", "All matches"],
        default: 0,
        label: "Matching mode"
    });
    settings.push({
        id: "strict_alternatives",
        kind: "checkbox",
        default: true,
        label: "Strict matching for alternative matches"
    });
    settings.push({
        id: "popup_requires_key",
        kind: "combobox",
        options: ["None", "Ctrl", "Shift"],
        default: 0,
        label: "Popup requires key"
    });
    settings.push({
        id: "ignore_linebreaks",
        kind: "checkbox",
        default: false,
        label: "Ignore hard line breaks"
    });
    settings.push({
        id: "live_mining",
        kind: "checkbox",
        default: false,
        label: "Enable live mining (experimental!) (configured via the button below under \"Other\")"
    });
    
    // display
    settings.push({
        kind: "dummy",
        label: "Display"
    });
    settings.push({
        id: "scale",
        kind: "number",
        min: 0.1,
        max: 64,
        step: 0.1,
        default: 1,
        label: "Lookup popup scale"
    });
    settings.push({
        id: "xoffset",
        kind: "number",
        min: 1,
        max: 200,
        step: 1,
        default: 5,
        label: "Popup offset, horizontal (pixels, default is 5)"
    });
    settings.push({
        id: "yoffset",
        kind: "number",
        min: 1,
        max: 200,
        step: 1,
        default: 22,
        label: "Popup offset, vertical (pixels, default is 22)"
    });
    settings.push({
        id: "width",
        kind: "number",
        min: 100,
        max: 10000,
        step: 1,
        default: 600,
        label: "Lookup popup width (before scaling) (limited to half the browser window width)"
    });
    settings.push({
        id: "sticky_maxheight",
        kind: "number",
        min: 0,
        max: 10000,
        default: 0,
        label: "Maximum height of Sticky and Mining UI modes - 0 is full screen"
    });
    settings.push({
        id: "fixedwidth",
        kind: "checkbox",
        default: false,
        label: "Fixed width"
    });
    settings.push({
        id: "fixedwidthpositioning",
        kind: "checkbox",
        default: false,
        label: "Position as though fixed width"
    });
    settings.push({
        id: "corner",
        kind: "combobox",
        options: ["Top left", "Top right", "Bottom left", "Bottom right"],
        default: 0,
        label: "Which corner of the popup follows the mouse"
    });
    settings.push({
        id: "x_dodge",
        kind: "combobox",
        options: ["Flip", "Push"],
        default: 1,
        label: "How to keep the popup on the screen horizontally"
    });
    settings.push({
        id: "y_dodge",
        kind: "combobox",
        options: ["Flip", "Push"],
        default: 0,
        label: "How to keep the popup on the screen vertically (at least one of these two options should be \"Flip\")"
    });
    
    // theme
    settings.push({
        kind: "dummy",
        label: "Theme"
    });
    settings.push({
        id: "superborder",
        kind: "checkbox",
        default: false,
        label: "Super border"
    });
    settings.push({
        id: "bgcolor",
        kind: "color",
        default: "#111111",
        label: "Background color"
    });
    settings.push({
        id: "fgcolor",
        kind: "color",
        default: "#CCCCCC",
        label: "Foreground color"
    });
    settings.push({
        id: "hlcolor",
        kind: "color",
        default: "#99DDFF",
        label: "Main highlight color"
    });
    settings.push({
        id: "hlcolor2",
        kind: "color",
        default: "#99FF99",
        label: "Reading highlight color"
    });
    settings.push({
        id: "font",
        kind: "text",
        default: "",
        label: "Font override (without trailing comma)"
    });
    settings.push({
        id: "hlfont",
        kind: "text",
        default: "",
        label: "Font override (highlighted text only) (without trailing comma)"
    });
    settings.push({
        id: "sticky",
        kind: "checkbox",
        default: false,
        label: "Sticky mode"
    });
    
    // reader
    settings.push({
        kind: "dummy",
        label: "Reader"
    });
    settings.push({
        id: "reader_width",
        kind: "number",
        min: 100,
        max: 10000,
        step: 1,
        default: 806,
        label: "Reader window default width"
    });
    settings.push({
        id: "reader_height",
        kind: "number",
        min: 50,
        max: 10000,
        step: 1,
        default: 300,
        label: "Reader window default height"
    });
    settings.push({
        id: "reader_reverse",
        kind: "checkbox",
        default: false,
        label: "Reader insert at bottom"
    });
    settings.push({
        id: "reader_leeway",
        kind: "number",
        min: 0,
        max: 10000,
        step: 1,
        default: 200,
        label: "Reader autoscroll leeway (when \"insert at bottom\" is enabled) (0 disables)"
    });
    
    // hotkeys
    settings.push({
        kind: "dummy",
        label: "Hotkeys (KeyboardEvent.key values)"
    });
    settings.push({
        id: "hotkey_mine",
        kind: "text",
        default: "m",
        label: "Mining UI hotkey"
    });
    settings.push({
        id: "hotkey_close",
        kind: "text",
        default: "n",
        label: "Close popup"
    });
    settings.push({
        id: "hotkey_sticky",
        kind: "text",
        default: "b",
        label: "Toggle sticky mode (useful for very long definition lists)"
    });
    settings.push({
        id: "hotkey_audio",
        kind: "text",
        default: "p",
        label: "Play audio from jpod101 if available"
    });
    settings.push({
        id: "hotkey_nudge_left",
        kind: "text",
        default: "ArrowLeft",
        label: "Nudge lookup text left"
    });
    settings.push({
        id: "hotkey_nudge_right",
        kind: "text",
        default: "ArrowRight",
        label: "Nudge lookup text right"
    });
    settings.push({
        id: "volume",
        kind: "number",
        min: 0.0,
        max: 1.0,
        step: 0.05,
        default: 0.2,
        label: "Audio playback volume (press \"p\" while popup is open)"
    });
    
    // other (added imperatively)
    settings.push({
        kind: "dummy",
        label: "Other"
    });
}
defaults();

function restoreListeners()
{
    for(let option of settings)
    {
        if(option.kind == "dummy") continue;
        document.querySelector("#"+option.id).addEventListener("change", setOptions);
    }
}
function removeListeners()
{
    for(let option of settings)
    {
        if(option.kind == "dummy") continue;
        document.querySelector("#"+option.id).removeEventListener("change", setOptions);
    }
}

function buildpage()
{
    let optionsection = document.querySelector("#optionsection");
    for(let option of settings)
    {
        if(option.kind == "dummy")
        {
            let header = document.createElement("h2");
            header.textContent = option.label;
            optionsection.appendChild(header);
            continue;
        }
        let container = document.createElement("div");
        let configger = undefined;
        if(option.kind == "checkbox")
        {
            let input = document.createElement("input");
            input.type = "checkbox";
            input.id = option.id;
            input.name = option.id;
            input.checked = option.default;
            input.style.zIndex = -100000;
            configger = input;
        }
        if(option.kind == "number")
        {
            let input = document.createElement("input");
            input.type = "number";
            input.id = option.id;
            input.name = option.id;
            input.min = option.min;
            input.max = option.max;
            input.value = option.default;
            input.step = option.step;
            configger = input;
        }
        if(option.kind == "combobox")
        {
            let select = document.createElement("select");
            select.id = option.id;
            select.name = option.id;
            let i = 0;
            for(let setting of option.options)
            {
                let opt = document.createElement("option");
                opt.value = i;
                opt.text = setting;
                select.add(opt);
                i += 1;
            }
            select.value = option.default;
            configger = select;
        }
        if(option.kind == "color")
        {
            let input = document.createElement("input");
            input.type = "color";
            input.id = option.id;
            input.name = option.id;
            input.value = option.default;
            configger = input;
        }
        if(option.kind == "text")
        {
            let input = document.createElement("input");
            input.type = "text";
            input.id = option.id;
            input.name = option.id;
            input.value = option.default;
            configger = input;
        }
        
        let label = document.createElement("label");
        label.for = option.id;
        let labelText = document.createTextNode(option.label);
        
        if(option.kind == "checkbox")
        {
            label.appendChild(configger);
            label.appendChild(labelText);
            container.appendChild(label);
        }
        else
        {
            label.appendChild(labelText);
            let cont1 = document.createElement("div");
            let cont2 = document.createElement("div");
            cont1.appendChild(configger);
            cont2.appendChild(label);
            container.appendChild(cont1);
            container.appendChild(cont2);
        }
        
        container.style.marginBottom = "8px";
        optionsection.appendChild(container);
    }
    
    // mining
    
    let liveminingbutton = document.createElement("button");
    liveminingbutton.type = "button";
    liveminingbutton.innerText = "Configure live mining";
    liveminingbutton.onclick = function(e){browser.windows.create({url:browser.extension.getURL('livemining.html'),type:'popup'}); e.preventDefault();};
    optionsection.appendChild(liveminingbutton);
    
    optionsection.appendChild(document.createElement("hr"));
    
    // deconjugation rules
    
    let decon_file = document.createElement("input");
    decon_file.type = "file";
    decon_file.id = "decon_file";
    decon_file.addEventListener("change", () =>
    {
        let fname = document.querySelector("#epwing_file").files[0];
        let reader = new FileReader();
        reader.onload = async(e) =>
        {
            try
            {
                browser.storage.local.set({"deconjugator_rules_json":JSON.stringify(JSON.parse(e.target.result))});
                browser.runtime.sendMessage({type:"refreshepwing"});
                document.querySelector("#import_label").textContent = "Imported. Might take a few seconds to apply.";
            }
            catch(except)
            {
                console.log(except.stack);
            }
        };
        reader.readAsText(fname);
    });
    let decon_label = document.createElement("label");
    decon_label.for = decon_file.id;
    decon_label.id = "import_label";
    decon_label.textContent = "Import deconjugation ruleset. Overrides default deconjugation ruleset. Importing a blank file and restarting your browser will restore the default ruleset.";
    decon_label.style.display = "block";
    
    optionsection.appendChild(decon_file);
    optionsection.appendChild(decon_label);
    
    optionsection.appendChild(document.createElement("hr"));
    
    // json dictionary
    
    let file = document.createElement("input");
    file.type = "file";
    file.id = "epwing_file";
    file.addEventListener("change", () =>
    {
        let fname = document.querySelector("#epwing_file").files[0];
        let reader = new FileReader();
        reader.onload = async(e) =>
        {
            try
            {
                browser.storage.local.set({"epwing":JSON.stringify(JSON.parse(e.target.result))});
                browser.runtime.sendMessage({type:"refreshepwing"});
                document.querySelector("#import_label").textContent = "Imported. Might take a few seconds to apply.";
            }
            catch(except)
            {
                console.log(except.stack);
            }
        };
        reader.readAsText(fname);
    });
    let label = document.createElement("label");
    label.for = file.id;
    label.id = "import_label";
    label.textContent = "Import JSON dictionary.";
    label.style.display = "block";
    
    let dict_explanation = document.createElement("p");
    dict_explanation.innerHTML = 
`JSON dictionaries have the following format:
<pre style='font-family:monospace !important' lang='en-US'>[
    "The Worst Dictionary Ever",
    {
        "r":"あ",
        "s":[
            "亜",
            "亞"
        ],
        "l":[
            "this is a single line of a definition"
        ]
    },
    {
        "r":"ああ",
        "s":[
            ""
        ],
        "l":[
            "1) yep",
            "　　1 - this is a multi-line, multi-part definition",
            "　　2 - dictionaries are crazy",
            "2) why is this word in a dictionary?"
        ]
    },
    //...
]</pre>
JSON dictionaries are JSON files consisting of a single array. The first entry is a string, the name of the dictionary. All remaining entries are objects, each containing the three keys "r", "s", and "l".<br>
"r" maps to a single string, the reading of that entry.<br>
"s" maps to an array listing strings that are all the possible spellings of the current entry. If the only spelling is the reading, there is a single blank string in the array of spellings.<br>
"l" maps to an array of strings, each of which are one of the lines of the definition, in order.<br>
This format is designed to be a sane generic mapping for EPWing dictionaries, after all the metadata is stripped out, and all "gaiji" encodings have been converted to unicode already.<br>
You can currently only have one JSON dictionary at a time and cannot manage the one you have imported aside from replacing it.<br>
Unfortunately, EPWING dictionaries can't be converted to this format in a general way. Someone has to write a script for every single EPWING dictionary out there, one at a time.<br>
This format can be extended in the future if it becomes desirable to include more information, like pitch accent data, from dictionaries that have it.`;
    
    optionsection.appendChild(file);
    optionsection.appendChild(label);
    optionsection.appendChild(dict_explanation);
    
    optionsection.appendChild(document.createElement("hr"));
    
    // backup
    
    let backup_save = document.createElement("button");
    backup_save.type = "button";
    backup_save.innerText = "Save Backup";
    backup_save.addEventListener("click", (async function ()
    {
        let blob = new Blob([JSON.stringify((await browser.storage.local.get()))], {type: 'text/plain'});
        let url = window.URL.createObjectURL(blob);

        let a = document.createElement("a");
        a.href = url;
        a.download = "nazeka_data_backup.json";
        console.log("trying to virtually click this a element:");
        console.log(a);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        window.URL.revokeObjectURL(url);
    }));
    optionsection.appendChild(backup_save);
    optionsection.appendChild(document.createElement("br"));
    
    let backup_load = document.createElement("input");
    backup_load.type = "file";
    backup_load.id = "backup_file";
    backup_load.addEventListener("change", () =>
    {
        let fname = document.querySelector("#backup_file").files[0];
        let reader = new FileReader();
        reader.onload = async(e) =>
        {
            try
            {
                browser.storage.local.set(JSON.parse(e.target.result));
                browser.runtime.sendMessage({type:"refreshepwing"});
                document.querySelector("#backup_load_label").textContent = "Loaded backup. Might take a few seconds to apply.";
            }
            catch(except)
            {
                console.log(except.stack);
            }
        };
        reader.readAsText(fname);
    });
    let backup_load_label = document.createElement("label");
    backup_load_label.for = backup_save.id;
    backup_load_label.id = "backup_load_label";
    backup_load_label.textContent = "Import Backup. WARNING: Overwrites ALMOST EVERYTHING, INCLUDING MINED CARDS.";
    backup_load_label.style.display = "block";
    optionsection.appendChild(backup_load);
    optionsection.appendChild(backup_load_label);
    
    optionsection.appendChild(document.createElement("hr"));
    
    let abbrlink = document.getElementById("abbrlink");
    abbrlink.onclick = function(e){browser.windows.create({url:browser.extension.getURL('jmdictabbreviations.html'),type:'popup'}); e.preventDefault();};
}

async function restoreOptions()
{
    try
    {
        async function getvar(name, defval)
        {
            let temp = (await browser.storage.local.get(name))[name]; // FIXME do this for all options instead of once per option
            if(temp == undefined)
                temp = defval;
            return temp;
        }
        let alternatives_mode = await getvar("alternatives_mode", 0);
        let strict_alternatives = await getvar("strict_alternatives", true);
        removeListeners();
        for(let option of settings)
        {
            if(option.kind == "dummy") continue;
            let value = await getvar(option.id, option.default);
            if(option.kind == "checkbox")
                document.querySelector("#"+option.id).checked = value?true:false;
            if(option.kind == "number" || option.kind == "text" || option.kind == "color" || option.kind == "combobox")
                document.querySelector("#"+option.id).value = value?value:option.default;
        }
    } catch (error) {}
    removeListeners();
    restoreListeners();
}

function fixicon()
{
    browser.runtime.sendMessage({type:"fixicon"});
}

function setOptions()
{
    let setstuff = {};
    for(let option of settings)
    {
        if(option.kind == "dummy") continue;
        if(option.kind == "checkbox")
            setstuff[option.id] = document.querySelector("#"+option.id).checked;
        if(option.kind == "number")
        {
            let num = Number(document.querySelector("#"+option.id).value);
            if(!num) // NaN is falsy
                num = option.default;
            if(option.step % 1 == 0)
                num = Math.round(num);
            setstuff[option.id] = num;
        }
        if(option.kind == "text")
            setstuff[option.id] = document.querySelector("#"+option.id).value;
        if(option.kind == "color")
            setstuff[option.id] = document.querySelector("#"+option.id).value;
        if(option.kind == "combobox")
            setstuff[option.id] = document.querySelector("#"+option.id).value;
    }
    browser.storage.local.set(setstuff).then(()=>{fixicon();},()=>{});
}

if (document.readyState == "complete")
{
    buildpage();
    restoreOptions();
}
else
{
    document.addEventListener("DOMContentLoaded", buildpage);
    document.addEventListener("DOMContentLoaded", restoreOptions);
}
