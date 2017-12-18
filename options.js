function restoreListeners()
{
    document.querySelector("#enabled").addEventListener("change", setOptions);
    document.querySelector("#compact").addEventListener("change", setOptions);
    document.querySelector("#length").addEventListener("change", setOptions);
    document.querySelector("#scale").addEventListener("change", setOptions);
    document.querySelector("#width").addEventListener("change", setOptions);
    document.querySelector("#lookuprate").addEventListener("change", setOptions);
    document.querySelector("#fixedwidth").addEventListener("change", setOptions);
    document.querySelector("#fixedwidthpositioning").addEventListener("change", setOptions);
    document.querySelector("#superborder").addEventListener("change", setOptions);
    document.querySelector("#showoriginal").addEventListener("change", setOptions);
    document.querySelector("#bgcolor").addEventListener("change", setOptions);
    document.querySelector("#fgcolor").addEventListener("change", setOptions);
    document.querySelector("#hlcolor").addEventListener("change", setOptions);
    document.querySelector("#font").addEventListener("change", setOptions);
    document.querySelector("#hlfont").addEventListener("change", setOptions);
    document.querySelector("#alternatives_mode").addEventListener("change", setOptions);
    document.querySelector("#strict_alternatives").addEventListener("change", setOptions);
}
function removeListeners()
{
    document.querySelector("#enabled").removeEventListener("change", setOptions);
    document.querySelector("#compact").removeEventListener("change", setOptions);
    document.querySelector("#length").removeEventListener("change", setOptions);
    document.querySelector("#scale").addEventListener("change", setOptions);
    document.querySelector("#width").addEventListener("change", setOptions);
    document.querySelector("#lookuprate").addEventListener("change", setOptions);
    document.querySelector("#fixedwidth").removeEventListener("change", setOptions);
    document.querySelector("#fixedwidthpositioning").removeEventListener("change", setOptions);
    document.querySelector("#superborder").addEventListener("change", setOptions);
    document.querySelector("#showoriginal").addEventListener("change", setOptions);
    document.querySelector("#bgcolor").addEventListener("change", setOptions);
    document.querySelector("#fgcolor").addEventListener("change", setOptions);
    document.querySelector("#hlcolor").addEventListener("change", setOptions);
    document.querySelector("#font").addEventListener("change", setOptions);
    document.querySelector("#hlfont").addEventListener("change", setOptions);
    document.querySelector("#alternatives_mode").addEventListener("change", setOptions);
    document.querySelector("#strict_alternatives").addEventListener("change", setOptions);
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
        let scale = await getvar("scale", 1);
        let width = await getvar("width", 600);
        let lookuprate = await getvar("lookuprate", 8);
        let fixedwidth = await getvar("fixedwidth", false);
        let fixedwidthpositioning = await getvar("fixedwidthpositioning", false);
        let superborder = await getvar("superborder", false);
        let showoriginal = await getvar("showoriginal", true);
        let bgcolor = await getvar("bgcolor", "#111111");
        let fgcolor = await getvar("fgcolor", "#CCCCCC");
        let hlcolor = await getvar("hlcolor", "#99DDFF");
        let font = await getvar("font", "");
        let hlfont = await getvar("hlfont", "");
        let alternatives_mode = await getvar("alternatives_mode", 0);
        let strict_alternatives = await getvar("strict_alternatives", true);
        removeListeners();
        document.querySelector("#enabled").checked = enabled?true:false;
        document.querySelector("#compact").checked = compact?true:false;
        document.querySelector("#length").value = length?length:25;
        document.querySelector("#scale").value = scale?scale:1;
        document.querySelector("#width").value = width?width:600;
        document.querySelector("#lookuprate").value = lookuprate?lookuprate:8;
        document.querySelector("#fixedwidth").checked = fixedwidth?true:false;
        document.querySelector("#fixedwidthpositioning").checked = fixedwidthpositioning?true:false;
        document.querySelector("#superborder").checked = superborder?true:false;
        document.querySelector("#showoriginal").checked = showoriginal?true:false;
        document.querySelector("#bgcolor").value = bgcolor?bgcolor:"#111111";
        document.querySelector("#fgcolor").value = fgcolor?fgcolor:"#CCCCCC";
        document.querySelector("#hlcolor").value = hlcolor?hlcolor:"#99DDFF";
        document.querySelector("#font").value = font?font:"";
        document.querySelector("#hlfont").value = hlfont?hlfont:"";
        document.querySelector("#alternatives_mode").value = alternatives_mode?alternatives_mode:0;
        document.querySelector("#strict_alternatives").checked = strict_alternatives?strict_alternatives:true;
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
    let length = parseInt(document.querySelector("#length").value, 10);
    if(!length) // NaN is falsy
        length = 25;
    let scale = Number(document.querySelector("#scale").value);
    if(!scale) // NaN is falsy
        scale = 1;
    let width = Number(document.querySelector("#width").value);
    if(!width) // NaN is falsy
        width = 600;
    let lookuprate = Number(document.querySelector("#lookuprate").value);
    if(!lookuprate) // NaN is falsy
        lookuprate = 8;
    browser.storage.local.set(
    {
        enabled: document.querySelector("#enabled").checked,
        compact: document.querySelector("#compact").checked,
        length: length,
        scale: scale,
        width: width,
        lookuprate: lookuprate,
        fixedwidth: document.querySelector("#fixedwidth").checked,
        fixedwidthpositioning: document.querySelector("#fixedwidthpositioning").checked,
        superborder: document.querySelector("#superborder").checked,
        showoriginal: document.querySelector("#showoriginal").checked,
        bgcolor: document.querySelector("#bgcolor").value,
        fgcolor: document.querySelector("#fgcolor").value,
        hlcolor: document.querySelector("#hlcolor").value,
        font: document.querySelector("#font").value,
        hlfont: document.querySelector("#hlfont").value,
        alternatives_mode: document.querySelector("#alternatives_mode").value,
        strict_alternatives: document.querySelector("#strict_alternatives").checked,
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
