function restoreListeners()
{
    document.querySelector("#enabled").addEventListener("change", setOptions);
    document.querySelector("#compact").addEventListener("change", setOptions);
}
function removeListeners()
{
    document.querySelector("#enabled").removeEventListener("change", setOptions);
    document.querySelector("#compact").removeEventListener("change", setOptions);
}

async function restoreOptions()
{
    restoreListeners();
    try
    {
        let enabled = (await browser.storage.local.get("enabled")).enabled;
        if(enabled == undefined)
            enabled = false;
        let compact = (await browser.storage.local.get("compact")).compact;
        if(compact == undefined)
            compact = true;
        removeListeners();
        document.querySelector("#enabled").checked = enabled?true:false;
        document.querySelector("#compact").checked = compact?true:false;
        restoreListeners();
    }
    catch (error){}
}

function setOptions()
{
    browser.storage.local.set(
    {
        enabled: document.querySelector("#enabled").checked,
        compact: document.querySelector("#compact").checked,
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
