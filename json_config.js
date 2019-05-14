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
function add_blank()
{
    dicts.push({"name": "Unnamed", "entries": "[]", "enabled": true});
    let list = document.getElementById("dicts");
    
    let option = document.createElement("option");
    option.innerText = "Unnamed";
    option.value = "Unnamed";
    list.appendChild(option);
    
    save_dicts();
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

function edit()
{
    let list = document.getElementById("dicts");
    let index = list.selectedIndex;
    if(index == -1)
        return;
    if(dicts[index].entries.length > 100*1000)
    {
        errormessage("This dictionary is too large to edit within your web browser.");
        return;
    }
    
    let name = dicts[index].name;
    let entries = JSON.stringify(JSON.parse(dicts[index].entries), null, 2);
    console.log(entries);
    
    document.getElementById("dict_manager").className = "closed";
    document.getElementById("dict_editor").className = "";
    document.getElementById("edit_name").value = name;
    document.getElementById("edit_entries").value = entries;
    
}
function edit_cancel()
{
    document.getElementById("dict_manager").className = "";
    document.getElementById("dict_editor").className = "closed";
    document.getElementById("edit_entries").value = "";
}
function edit_apply(and_then = undefined)
{
    try
    {
        let list = document.getElementById("dicts");
        let index = list.selectedIndex;
        if(index != -1)
        {
            let new_name = document.getElementById("edit_name").value;
            let new_json = JSON.stringify(JSON.parse(document.getElementById("edit_entries").value));
            dicts[index].name = new_name;
            dicts[index].entries = new_json;
            list[index].value = new_name;
            list[index].innerText = new_name;
            
            save_dicts();
        }
        if(and_then)
            and_then();
    }
    catch(e)
    {
        errormessage(e);
    }
}
function edit_okay()
{
    edit_apply(edit_cancel);
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
    
    dicts = (await get_storage_or_default("custom_dicts", []));
    list.innerHTML = "";
    
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

let delete_timeout = undefined;

function really_delete()
{
    console.log("on REALLY delete");
    set_base_delete_mode();
    
    let list = document.getElementById("dicts");
    let index = list.selectedIndex;
    if(index == -1)
        return;
    console.log("gonna delete it!");
    
    dicts.splice(index, 1);
    list.remove(index);
    
    save_dicts();
}

function ask_delete()
{
    document.getElementById("delete").onclick = really_delete;
    document.getElementById("delete").innerText = "REALLY Delete";
    delete_timeout = setTimeout(set_base_delete_mode, 5000);
}

function set_base_delete_mode()
{
    try
    {
        clearTimeout(delete_timeout);
    } catch(e) {}
    delete_timeout = undefined;
    document.getElementById("delete").onclick = ask_delete;
    document.getElementById("delete").innerText = "Delete";
}

function import_new()
{
    document.getElementById("file_input").click();
}

function export_dict()
{
    let list = document.getElementById("dicts");
    let index = list.selectedIndex;
    if(index == -1)
        return;
    
    let name = dicts[index].name;
    let obj = JSON.parse(dicts[index].entries);
    obj.unshift(name);
    
    let blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'text/plain'});
    let url = window.URL.createObjectURL(blob);

    let a = document.createElement("a");
    a.href = url;
    a.download = "nazeka_dict_export_"+name+".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    window.URL.revokeObjectURL(url);
}


function buildpage()
{
    document.getElementById("move_up").onclick = move_up;
    document.getElementById("move_down").onclick = move_down;
    document.getElementById("toggle").onclick = toggle;
    document.getElementById("add").onclick = add_blank;
    document.getElementById("edit").onclick = edit;
    document.getElementById("delete").onclick = ask_delete;
    document.getElementById("edit_apply").onclick = edit_apply;
    document.getElementById("edit_okay").onclick = edit_okay;
    document.getElementById("edit_cancel").onclick = edit_cancel;
    
    document.getElementById("import").onclick = import_new;
    document.getElementById("export").onclick = export_dict;
    
    
    document.getElementById("file_input").onchange = () =>
    {
        let fname = document.getElementById("file_input").files[0];
        let reader = new FileReader();
        reader.onload = async(e) =>
        {
            // FIXME: add asking for the unlimited storage permission
            try
            {
                let myobj = JSON.parse(e.target.result);
                let name = myobj.shift();
                dicts.push({"name": name, "entries": JSON.stringify(myobj), "enabled": true});
                
                let option = document.createElement("option");
                option.innerText = name;
                option.value = name;
                
                let list = document.getElementById("dicts");
                list.appendChild(option);
                
                save_dicts();
            }
            catch(e)
            {
                errormessage(e);
            }
        };
        reader.readAsText(fname);
    };
    
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
