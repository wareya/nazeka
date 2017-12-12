function restoreListeners()
{
    document.querySelector("#enabled").addEventListener("change", setOptions);
    document.querySelector("#compact").addEventListener("change", setOptions);
    document.querySelector("#length").addEventListener("change", setOptions);
    document.querySelector("#fixedwidth").addEventListener("change", setOptions);
    document.querySelector("#fixedwidthpositioning").addEventListener("change", setOptions);
}
function removeListeners()
{
    document.querySelector("#enabled").removeEventListener("change", setOptions);
    document.querySelector("#compact").removeEventListener("change", setOptions);
    document.querySelector("#length").removeEventListener("change", setOptions);
    document.querySelector("#fixedwidth").removeEventListener("change", setOptions);
    document.querySelector("#fixedwidthpositioning").removeEventListener("change", setOptions);
}

async function restoreOptions()
{
    try
    {
        let enabled = (await browser.storage.local.get("enabled")).enabled;
        if(enabled == undefined)
            enabled = false;
        let compact = (await browser.storage.local.get("compact")).compact;
        if(compact == undefined)
            compact = true;
        let length = (await browser.storage.local.get("length")).length;
        if(length == undefined)
            length = 25;
        let fixedwidth = (await browser.storage.local.get("fixedwidth")).fixedwidth;
        if(fixedwidth == undefined)
            fixedwidth = false;
        let fixedwidthpositioning = (await browser.storage.local.get("fixedwidthpositioning")).fixedwidthpositioning;
        if(fixedwidthpositioning == undefined)
            fixedwidthpositioning = false;
        removeListeners();
        document.querySelector("#enabled").checked = enabled?true:false;
        document.querySelector("#compact").checked = compact?true:false;
        document.querySelector("#length").value = length?length:25;
        document.querySelector("#fixedwidth").checked = fixedwidth?true:false;
        document.querySelector("#fixedwidthpositioning").checked = fixedwidthpositioning?true:false;
    }
    catch (error){}
    removeListeners();
    restoreListeners();
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
    });
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
