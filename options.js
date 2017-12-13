function restoreListeners()
{
    document.querySelector("#enabled").addEventListener("change", setOptions);
    document.querySelector("#compact").addEventListener("change", setOptions);
    document.querySelector("#length").addEventListener("change", setOptions);
    document.querySelector("#fixedwidth").addEventListener("change", setOptions);
    document.querySelector("#fixedwidthpositioning").addEventListener("change", setOptions);
    document.querySelector("#superborder").addEventListener("change", setOptions);
    document.querySelector("#showoriginal").addEventListener("change", setOptions);
}
function removeListeners()
{
    document.querySelector("#enabled").removeEventListener("change", setOptions);
    document.querySelector("#compact").removeEventListener("change", setOptions);
    document.querySelector("#length").removeEventListener("change", setOptions);
    document.querySelector("#fixedwidth").removeEventListener("change", setOptions);
    document.querySelector("#fixedwidthpositioning").removeEventListener("change", setOptions);
    document.querySelector("#superborder").addEventListener("change", setOptions);
    document.querySelector("#showoriginal").addEventListener("change", setOptions);
}

async function restoreOptions()
{
    try
    {
        async function getvar(name, defval)
        {
            let temp = (await browser.storage.local.get(name))[name];
            if(temp == undefined)
                temp = defval;
            return temp;
        }
        let enabled = await getvar("enabled", false);
        let compact = await getvar("compact", true);
        let length = await getvar("length", 25);
        let fixedwidth = await getvar("fixedwidth", false);
        let fixedwidthpositioning = await getvar("fixedwidthpositioning", false);
        let superborder = await getvar("superborder", false);
        let showoriginal = await getvar("showoriginal", true);
        removeListeners();
        document.querySelector("#enabled").checked = enabled?true:false;
        document.querySelector("#compact").checked = compact?true:false;
        document.querySelector("#length").value = length?length:25;
        document.querySelector("#fixedwidth").checked = fixedwidth?true:false;
        document.querySelector("#fixedwidthpositioning").checked = fixedwidthpositioning?true:false;
        document.querySelector("#superborder").checked = superborder?true:false;
        document.querySelector("#showoriginal").checked = showoriginal?true:false;
    }
    catch (error){}
    removeListeners();
    restoreListeners();
}

function fixicon()
{
    browser.runtime.sendMessage({type:"fixicon"});
}

function setOptions()
{
    let length = parseInt(document.querySelector("#length").value, 10);
    if(!length) // NaN is falsy
        length = 25;
    browser.storage.local.set(
    {
        enabled: document.querySelector("#enabled").checked,
        compact: document.querySelector("#compact").checked,
        length: length,
        fixedwidth: document.querySelector("#fixedwidth").checked,
        fixedwidthpositioning: document.querySelector("#fixedwidthpositioning").checked,
        superborder: document.querySelector("#superborder").checked,
        showoriginal: document.querySelector("#showoriginal").checked,
    }).then(()=>{fixicon();},()=>{});
}

if (document.readyState == "complete")
{
    restoreOptions();
    //setOptions();
}
else
{
    document.addEventListener("DOMContentLoaded", restoreOptions);
    //document.addEventListener("DOMContentLoaded", setOptions);
}
