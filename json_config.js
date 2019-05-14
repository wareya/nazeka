let dicts = [];

function save_dicts()
{
    browser.storage.local.set({"custom_dicts": dicts});
    browser.runtime.sendMessage({type:"refreshjson"});
}

function move_up()
{
    let list = document.getElementById("dicts");
    let index = list.selectedIndex;
    if(index == -1 || index == 0)
        return;
    list.add(list[index], list[index-1]);
    
    let temp = dicts[index];
    dicts[index] = dicts[index-1];
    dicts[index-1] = temp;
    
    save_dicts();
}
function move_down()
{
    let list = document.getElementById("dicts");
    let index = list.selectedIndex;
    if(index == -1 || index == list.length-1)
        return;
    list.add(list[index], list[index+2]);
    
    let temp = dicts[index];
    dicts[index] = dicts[index+1];
    dicts[index+1] = temp;
    
    save_dicts();
}
function toggle()
{
    let list = document.getElementById("dicts");
    let index = list.selectedIndex;
    if(index == -1)
        return;
    if(list[index].className == "disabled")
    {
        list[index].className = "";
    }
    else
    {
        list[index].className = "disabled";
    }
    dicts[index].enabled = !dicts[index].enabled;
    
    save_dicts();
}

function or_default(val, fallback)
{
    if(val !== undefined)
        return val;
    else
        return fallback;
}
async function get_storage_or_default(name, fallback)
{
    return or_default((await browser.storage.local.get(name))[name], fallback);
}

async function insert_dicts()
{
    let list = document.getElementById("dicts");
    list.innerHTML = "";
    
    dicts = (await get_storage_or_default("custom_dicts", []));
    
    for(let stored_dict of dicts)
    {
        let option = document.createElement("option");
        option.innerText = stored_dict.name;
        option.value = stored_dict.name;
        if(!stored_dict.enabled)
            option.className = "disabled";
        list.appendChild(option);
    }
}

function buildpage()
{
    document.getElementById("move_up").onclick = move_up;
    document.getElementById("move_down").onclick = move_down;
    document.getElementById("toggle").onclick = toggle;
    
    insert_dicts();
}

if (document.readyState == "complete")
{
    buildpage();
}
else
{
    document.addEventListener("DOMContentLoaded", buildpage);
}
