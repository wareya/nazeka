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
        label: "Lookup popup width (before scaling)"
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
        options: ["Top left", "Top right", "Bottom left", "Bottom right", "Top auto"],
        default: 0,
        label: "Popup positioning corner (note: for \"bottom\" corners, order of definitions is reversed, but \"original text\" still shows up at top of each lookup's definitions, not bottom) (\"top auto\" feels very bad unless \"position as though fixed width\" is also enabled)"
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
        label: "Highlight color"
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
    
    // other (added procedurally)
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
    let file = document.createElement("input");
    file.type = "file";
    file.id = "file";
    file.addEventListener("change", () =>
    {
        let fname = document.querySelector("#file").files[0];
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
    label.textContent = "Import thin dictionary";
    label.style.display = "block";
    
    optionsection.appendChild(file);
    optionsection.appendChild(label);
    
    optionsection.appendChild(document.createElement("hr"));
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
