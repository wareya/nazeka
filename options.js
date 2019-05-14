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
        id: "kanji_mode",
        kind: "checkbox",
        default: false,
        label: "Individual kanji information mode"
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
        id: "space_saver",
        kind: "checkbox",
        default: false,
        label: "Space saver (removes extra formatting from readings and other spellings)"
    });
    settings.push({
        id: "hide_deconj",
        kind: "checkbox",
        default: false,
        label: "Hide deconjugations"
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
        options: ["Longest match only", "Longest and second longest match", "Longest and shortest match", "All matches"],
        default: 3,
        label: "Matching mode"
    });
    settings.push({
        id: "strict_alternatives",
        kind: "checkbox",
        default: true,
        label: "Strict matching for alternative matches"
    });
    settings.push({
        id: "definitions_mode",
        kind: "combobox",
        options: ["From jmdict then json", "From json then jmdict", "From json; otherwise jmdict", "From json dictionary only", "None"],
        default: 0,
        label: "Where to look for definitions (does not affect jmdict readings)"
    });
    settings.push({
        id: "normal_definitions_in_mining",
        kind: "checkbox",
        default: false,
        label: "Force \"From jmdict then json\" definitions mode when mining UI is open"
    });
    settings.push({
        id: "strict_epwing",
        kind: "checkbox",
        default: true,
        label: "Strict matching for json dictionary matches"
    });
    settings.push({
        id: "popup_requires_key",
        kind: "combobox",
        options: ["None", "Ctrl", "Shift"],
        default: 0,
        label: "Popup requires key"
    });
    settings.push({
        id: "strip_spaces",
        kind: "checkbox",
        default: true,
        label: "Strip spaces (for when spaces find their way into Japanese text and it breaks word searching)"
    });
    settings.push({
        id: "ignore_linebreaks",
        kind: "checkbox",
        default: true,
        label: "Ignore hard line breaks (disable for text with preformatted linebreaks)"
    });
    settings.push({
        id: "ignore_divs",
        kind: "checkbox",
        default: false,
        label: "Search out from within block-like elements like divs (enable only for very poorly-constructed web pages; usually causes performance problems)"
    });
    settings.push({
        id: "live_mining",
        kind: "checkbox",
        default: false,
        label: "Enable live mining (configured via the button below under \"Other\")"
    });
    settings.push({
        id: "use_selection",
        kind: "checkbox",
        default: false,
        label: "Use text selection to limit lookup length and force context"
    });
    settings.push({
        id: "only_selection",
        kind: "checkbox",
        default: false,
        label: "Only look up text when mousing over selection (only when something is selected, setting ignored otherwise)"
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
    /*
    // currently broken
    settings.push({
        id: "fixedwidthpositioning",
        kind: "checkbox",
        default: false,
        label: "Position as though fixed width (currently nonfunctional; will fix later)"
    });
    */
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
        id: "disableborder",
        kind: "checkbox",
        default: false,
        label: "Disable border"
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
        id: "definition_fontsize",
        kind: "number",
        min: 4,
        max: 48,
        default: 13,
        label: "Definition font size"
    });
    settings.push({
        id: "dict_item_fontsize",
        kind: "number",
        min: 4,
        max: 48,
        default: 18,
        label: "Dictionary item font size"
    });
    settings.push({
        id: "reading_fontsize",
        kind: "number",
        min: 4,
        max: 48,
        default: 15,
        label: "Reading font size"
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
    
    settings.push({
        id: "reader_bg",
        kind: "color",
        default: "#111111",
        label: "Reader background color"
    });
    settings.push({
        id: "reader_fg",
        kind: "color",
        default: "#CCCCCC",
        label: "Reader text color"
    });
    settings.push({
        id: "reader_font_size",
        kind: "text",
        default: "1.4em",
        label: "Reader text size"
    });
    settings.push({
        id: "reader_right_padding",
        kind: "text",
        default: "0px",
        label: "Reader right padding (useful if you use 'sticky' mode)"
    });
    settings.push({
        id: "reader_max_width",
        kind: "text",
        default: "1000px",
        label: "Reader max width"
    });
    settings.push({
        id: "reader_margin",
        kind: "text",
        default: "8px",
        label: "Reader left/right margins"
    });
    settings.push({
        id: "reader_font",
        kind: "text",
        default: "",
        label: "Reader font override (without trailing comma)"
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
        id: "hotkey_kanji_mode",
        kind: "text",
        default: "k",
        label: "Toggle individual kanji information mode on/off"
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
        let fname = document.querySelector("#decon_file").files[0];
        let reader = new FileReader();
        reader.onload = async(e) =>
        {
            try
            {
                let text = e.target.result;
                if(text == "" || text == "\n" || text == "\r\n")
                    browser.storage.local.set({"deconjugator_rules_json":""});
                else
                    browser.storage.local.set({"deconjugator_rules_json":JSON.stringify(JSON.parse())});
                document.querySelector("#decon_label").textContent = "Imported. Might take a few seconds to apply.";
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
    decon_label.id = "decon_label";
    decon_label.textContent = "Import deconjugation ruleset. Overrides default deconjugation ruleset. Importing a blank file will restore the default ruleset.";
    decon_label.style.display = "block";
    
    optionsection.appendChild(decon_file);
    optionsection.appendChild(decon_label);
    
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
                browser.runtime.sendMessage({type:"refreshjson"});
                document.querySelector("#backup_load_label").textContent = "Loaded backup. Might take a few seconds to apply.";
            }
            catch(except)
            {
                console.log(except.stack);
            }
        };
        reader.readAsText(fname);
    });
    // FIXME: add asking for the unlimited storage permission
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
