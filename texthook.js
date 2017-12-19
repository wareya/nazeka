// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

/*
 * TODO:
 * 
 * ! Finish porting the underlay's deconjugation rules
 * - Fix katakana-hiragana matching (only happens in lookups right now, not display generation)
 * - More configurability
 * - VNstats frequency data
 * - Integrate frequency into priority handling
 * - Load deconjugation rules from an advanced setting, with a reset button
 * - Mining support features
 * ? Export/import settings with json
 * ? List definitions of shorter text strings if they're not pure kana (in addition to main definitions)
 * 
 */

'use strict';

function print_object(message)
{
    //console.log(JSON.stringify(message));
    console.log(message);
}

let settings = {
enabled: false,
compact: true,
usetextfields: true,
length: 25,
fixedwidth: false,
fixedwidthpositioning: false,
superborder: false,
showoriginal: true,
alternatives_mode: 0, // 0: longest only; 1: longest and shortest; 2: longest and second longest; 3: all matches
strict_alternatives: true, // if true, alternatives looked up in all kana can not return results with kanji glosses that don't have any usually/exclusively kana info
scale: 1,
width: 600,
lookuprate: 8,
bgcolor: "#111111",
fgcolor: "#CCCCCC",
hlcolor: "#99DDFF",
font: "",
hlfont: "",
};

let last_time_display = Date.now();

let div_class = "nazeka_fGKRTDGFGgr9atT";

let last_displayed = undefined;
function delete_div ()
{
    last_displayed = undefined;
    let other = document.body.getElementsByClassName(div_class);
    if(other.length > 0)
    {
        other[0].style.display = "none";
        if(other[0].children.length > 0)
            other[0].children[0].innerHTML = "";
    }
}

function display_div (middle, x, y, time)
{
    //let bordercolor = undefined;
    //if(settings.superborder)
    //    bordercolor = "white";
    //else
    //    bordercolor = "#CCC";
    let font = settings.font.trim().replace(";","");
    if(font != "")
        font += ",";
    middle.style = `background-color: ${settings.bgcolor}; border-radius: 2.5px; border: 1px solid ${settings.bgcolor};`;
    middle.firstChild.style = `border: 1px solid ${settings.fgcolor}; border-radius: 2px; padding: 2px; background-color: ${settings.bgcolor}; color: ${settings.fgcolor}; font-family: ${font} Arial, sans-serif; font-size: 13px; text-align: left;`;
    
    let find_root = window;
    let newx = x;
    let newy = y;
    while(find_root.parent && find_root.parent != find_root)
    {
        let rect = find_root.frameElement.getBoundingClientRect();
        let sx = find_root.scrollX;
        let sy = find_root.scrollY;
        find_root = find_root.parent;
        newx += (rect.x - sx);
        newy += (rect.y - sy);
    }
    let mydoc = find_root.document;
    
    let styletext = "";
    if(settings.fixedwidth)
        styletext += "width: " + Math.round(Number(settings.width)) + "px; "
    else
        styletext += "max-width: " + Math.round(Number(settings.width)) + "px; "
    styletext += "position: absolute; top: 0; left: 0; ";
    
    if(settings.superborder)
        styletext += `background-color: ${settings.fgcolor}; border-radius: 3px; border: 1px solid ${settings.fgcolor}; z-index: 100000;`;
    else
        styletext += `border-radius: 3px; background-color: ${settings.bgcolor}; z-index: 100000;`;
    
    let other = mydoc.body.getElementsByClassName(div_class);
    let outer = undefined;
    if(other.length > 0)
    {
        outer = other[0];
        outer.replaceChild(middle, other[0].firstChild);
        outer.style.display = "block";
    }
    else
    {
        outer = mydoc.createElement("div");
        outer.className = div_class;
        outer.appendChild(middle);
        mydoc.body.appendChild(outer);
    }
    
    outer.lang = "ja";
    
    if(settings.scale != 1 && settings.scale > 0 && settings.scale < 64)
        styletext += " transform-origin: top left; transform: scale(" + Number(settings.scale) + ");";
    
    outer.style = styletext;
    
    let mywidth = settings.width*settings.scale;
    if(!settings.fixedwidthpositioning)
        mywidth = outer.offsetWidth*settings.scale;
    
    let buffer = 25;
    let pretend_doc_width = Math.max(mywidth, mydoc.defaultView.innerWidth);
    if(newx + mywidth > pretend_doc_width-buffer)
    {
        newx -= (newx + mywidth - pretend_doc_width);
        newx -= buffer;
        if(newx < 0)
            newx = 0;
    }
    
    outer.style.top = (newy+5)+"px";
    outer.style.left = (newx+5)+"px";
}

function exists_div()
{
    let find_root = window;
    while(find_root.parent && find_root.parent != find_root)
        find_root = find_root.parent;
    let mydoc = find_root.document;
    
    let other = document.body.getElementsByClassName(div_class);
    return (other.length > 0 && other[0].style.display != "none");
}


// In JMdict, part-of-speech tags are XML entities.
// We processed JMdict's XML with entity processing disabled so we can just use the bare tags (e.g. "v1", not "ichidan verb").
// This left the entity syntax &this; behind so we want to cut it off when we return results.
function clip(str)
{
    if(str == undefined)
        return;
    if(str.length <= 2)
        return "";
    return str.substring(1, str.length-1);
}

function build_div_inner (text, result)
{
    //console.log("building div for " + text);
    //console.log(result);
    let temp = document.createElement("div");
    if(settings.showoriginal)
    {
        let original = document.createElement("div");
        original.className = "nazeka_original";
        original.textContent = "Looked up ";
        let original_inner = document.createElement("span");
        original_inner.className = "nazeka_lookup";
        original_inner.textContent = text;
        original.appendChild(original_inner);
        temp.appendChild(original);
    }
    else
    {
        let original_inner = document.createElement("span");
        original_inner.className = "nazeka_lookup";
        original_inner.textContent = text;
        original_inner.style.display = "none";
        temp.appendChild(original_inner);
    }
    
    let style = document.createElement("style");
    style.type = "text/css";
    let font = settings.hlfont.trim();
    if(font != "")
        font += ",";
    if(settings.font.trim().replace(";","") != "")
        font += settings.font.trim().replace(";","") + ",";
    style.textContent =
`.nazeka_main_keb{font-family: ${font}IPAGothic,TakaoGothic,Noto Sans CJK JP Regular,Meiryo,sans-serif;font-size:18px;color:${settings.hlcolor}}\
.nazeka_main_reb{font-family: ${font}IPAGothic,TakaoGothic,Noto Sans CJK JP Regular,Meiryo,sans-serif;font-size:18px;color:${settings.hlcolor}}\
.nazeka_original{float: right; margin-right: 2px; margin-left:4px; opacity:0.7;}\
`;
    temp.appendChild(style);
    
    // lookups can have multiple results (e.g. する -> 為る, 刷る, 掏る, 剃る, 擦る)
    // FIXME: A bunch of code here depends on the literal text used to run the search instead of the text with which the search succeeded.
    // The search can convert between hiragana and katakana to find a valid match, so we should know what text it actually used.
    for(let i = 0; i < result.length; i++)
    {
        let term = result[i];
        let container = document.createElement("div");
        container.className = "nazeka_word_container";
        container.style.marginBottom = "3px";
        container.setAttribute("nazeka_seq", term.seq);
        if(term.deconj && term.deconj.length > 0)
            text = term.deconj.values().next().value.text;
        //print_object(term);
        let temptag = document.createElement("span");
        temptag.className = "nazeka_word";
        let found_kanji = true;
        if(term.k_ele)
        {
            // pick out which index has the kanji we looked up if we looked up kanji
            let which = 0;
            let looked_up_kanji = true;
            while(which < term.k_ele.length && term.k_ele[which].keb != text) which += 1;
            if(which >= term.k_ele.length)
            {
                which = 0;
                looked_up_kanji = false;
            }
            let whichkana = 0;
            let r_restr = [];
            if(!looked_up_kanji)
            {
                while(whichkana < term.r_ele.length && term.r_ele[whichkana].reb != text) whichkana += 1;
                if(whichkana >= term.r_ele.length)
                    whichkana = 0;
                
                whichkana = term.r_ele[whichkana];
                
                if(whichkana.restr && whichkana.restr.length > 0)
                    r_restr = whichkana.restr;
                
                for(let j = 0; j < term.k_ele.length; j++)
                {
                    if(term.k_ele[j].restr)
                    {
                        for(let l = 0; l < term.k_ele[j].restr.length; l++)
                        {
                            if(term.k_ele[j].restr[l] == text)
                            {
                                if(!r_restr || r_restr.indexOf(term.k_ele[j].keb) > -1)
                                {
                                    which = j;
                                    found_kanji = true;
                                    break;
                                }
                            }
                        }
                    }
                    else
                    {
                        if(!r_restr || r_restr.indexOf(term.k_ele[j].keb) > -1)
                        {
                            which = j;
                            found_kanji = true;
                            break;
                        }
                    }
                }
            }
            else
                found_kanji = true;
            if(found_kanji)
            {
                let kanji_text = term.k_ele[which].keb;
                let keb = document.createElement("span");
                keb.className = "nazeka_main_keb";
                keb.textContent = kanji_text;
                temptag.appendChild(keb);
                // FIXME: show inf for located keb
                
                // list readings
                let readings = [];
                // don't list readings if restricted to kanji we didn't look up
                for(let j = 0; j < term.r_ele.length; j++)
                {
                    let r = term.r_ele[j];
                    let invalid = r.restr != undefined;
                    if(r.restr)
                    {
                        for(let l = 0; l < r.restr.length; l++)
                            if(r.restr[l] == kanji_text)
                                invalid = false;
                    }
                    if(!invalid)
                        readings.push(term.r_ele[j]);
                    
                }
                if(term.deconj)
                {
                    let deconj = "";
                    let first = true;
                    for(let form of term.deconj)
                    {
                        let formtext = "";
                        let added = 0;
                        for(let f = form.process.length-1; f >= 0; f--)
                        {
                            let info = form.process[f];
                            if(info == "")
                                continue;
                            if(info.startsWith("(") && info.endsWith(")") && f != 0)
                                continue;
                            if(added > 0)
                                formtext += "―";
                            added++;
                            formtext += info;
                        }
                        if(formtext != "")
                        {
                            if(first)
                                deconj += "～";
                            else
                                deconj += "・";
                            deconj += formtext;
                        }
                        first = false;
                    }
                    temptag.appendChild(document.createTextNode(deconj));
                }
                temptag.appendChild(document.createTextNode(" 《"));
                let e_readings = document.createElement("span");
                e_readings.className = "nazeka_readings";
                for(let j = 0; j < readings.length; j++)
                {
                    e_readings.appendChild(document.createTextNode(readings[j].reb));
                    if(readings[j].inf)
                    {
                        for(let info of readings[j].inf)
                        {
                            let reb_inf = document.createElement("span");
                            reb_inf.className = "nazeka_reb_inf";
                            reb_inf.textContent += "(";
                            reb_inf.textContent += clip(info);
                            reb_inf.textContent += ")";
                            e_readings.appendChild(reb_inf);
                        }
                    }
                    if(j+1 != readings.length)
                        e_readings.appendChild(document.createTextNode("・"));
                }
                temptag.appendChild(e_readings);
                temptag.appendChild(document.createTextNode("》"));
                
                // list alternatives
                let alternatives = [];
                // don't list spellings if restricted to kana we didn't look up
                for(let j = 0; j < term.k_ele.length; j++)
                {
                    if(term.k_ele[j].keb != kanji_text)
                    {
                        let k = term.k_ele[j];
                        let invalid = !looked_up_kanji && k.restr;
                        if(!looked_up_kanji && k.restr)
                        {
                            for(let l = 0; l < k.restr.length; l++)
                                if(k.restr[l] == text)
                                    invalid = false;
                        }
                        if(!looked_up_kanji && r_restr !== [] && r_restr.length > 0 && r_restr.indexOf(k.keb) < 0)
                            invalid = true;
                        if(!invalid)
                            alternatives.push(term.k_ele[j]);
                    }
                }
                
                if(alternatives.length > 0)
                    temptag.appendChild(document.createTextNode(" (also "));
                for(let j = 0; j < alternatives.length; j++)
                {
                    temptag.appendChild(document.createTextNode(alternatives[j].keb));
                    if(alternatives[j].inf)
                    {
                        for(let info of alternatives[j].inf)
                        {
                            temptag.appendChild(document.createTextNode(" "));
                            let keb_inf = document.createElement("span");
                            keb_inf.className = "nazeka_keb_inf";
                            keb_inf.textContent += "(";
                            keb_inf.textContent += clip(info);
                            keb_inf.textContent += ")";
                            temptag.appendChild(keb_inf);
                        }
                    }
                    if(j+1 < alternatives.length)
                        temptag.appendChild(document.createTextNode(", "));
                }
                if(alternatives.length > 0)
                    temptag.appendChild(document.createTextNode(")"));
            }
        }
        else
            found_kanji = false;
        if(!found_kanji)
        {
            let main_reb = document.createElement("span");
            main_reb.className = "nazeka_main_reb";
            main_reb.textContent = text;
            temptag.appendChild(main_reb);
            // FIXME: show inf for located reb
            if(term.deconj)
            {
                let deconj = "";
                let first = true;
                for(let form of term.deconj)
                {
                    let formtext = "";
                    let added = 0;
                    for(let f = form.process.length-1; f >= 0; f--)
                    {
                        let info = form.process[f];
                        if(info == "")
                            continue;
                        if(info.startsWith("(") && info.endsWith(")") && f != 0)
                            continue;
                        if(added > 0)
                            formtext += "―";
                        added++;
                        formtext += info;
                    }
                    if(formtext != "")
                    {
                        if(first)
                            deconj += "～";
                        else
                            deconj += "・";
                        deconj += formtext;
                    }
                    first = false;
                }
                temptag.appendChild(document.createTextNode(deconj));
            }
            
            // list alternatives
            let alternatives = [];
            
            for(let j = 0; j < term.r_ele.length; j++)
                if(term.r_ele[j].reb != text)
                    alternatives.push(term.r_ele[j]);
            
            if(alternatives.length > 0)
                temptag.appendChild(document.createTextNode(" (also "));
            for(let j = 0; j < alternatives.length; j++)
            {
                temptag.appendChild(document.createTextNode(alternatives[j].reb));
                if(alternatives[j].inf)
                {
                    for(let info of alternatives[j].inf)
                    {
                        temptag.appendChild(document.createTextNode(" "));
                        let reb_inf = document.createElement("span");
                        reb_inf.className = "nazeka_reb_inf";
                        reb_inf.textContent += "(";
                        reb_inf.textContent += clip(info);
                        reb_inf.textContent += ")";
                        temptag.appendChild(reb_inf);
                    }
                }
                if(j+1 < alternatives.length)
                    temptag.appendChild(document.createTextNode(", "));
            }
            if(alternatives.length > 0)
                temptag.appendChild(document.createTextNode(")"));
        }
        container.appendChild(temptag);
        container.appendChild(document.createElement("br"));
        
        let goodsenses = [];
        for(let j = 0; j < term.sense.length; j++)
        {
            let sense = term.sense[j];
            
            if(sense.stagk && found_kanji)
            {
                let found = false;
                for(let l = 0; l < sense.stagk.length; l++)
                    if(sense.stagk[l] == text)
                        found = true;
                if(!found)
                    continue;
            }
            if(sense.stagr && !found_kanji)
            {
                let found = false;
                for(let l = 0; l < sense.stagr.length; l++)
                    if(sense.stagr[l] == text)
                        found = true;
                if(!found)
                    continue;
            }
            goodsenses.push(sense);
        }
        let lastpos = [];
        let definition = document.createElement("div");
        definition.className = "nazeka_definitions";
        for(let j = 0; j < goodsenses.length; j++)
        {
            let sense = goodsenses[j];
            
            if(sense.pos == lastpos)
                sense.pos = undefined;
            else
                lastpos = sense.pos;
            
            if(sense.pos)
            {
                let part = document.createElement("span");
                part.className = "nazeka_pos";
                let temptext = "(";
                let parts = [];
                for(let l = 0; l < sense.pos.length; l++)
                    parts.push(sense.pos[l]);
                temptext += parts.join(", ");
                temptext += ")";
                part.textContent = temptext;
                definition.appendChild(part);
                if(settings.compact)
                    definition.appendChild(document.createTextNode(" "));
                else
                    definition.appendChild(document.createElement("br"));
                
            }
            if(settings.compact)
            {
                if(goodsenses.length > 1)
                {
                    let number = document.createElement("span");
                    number.className = "nazeka_num";
                    number.textContent = "("+(j+1)+")";
                    definition.appendChild(number);
                    definition.appendChild(document.createTextNode(" "));
                }
            }
            else
            {
                let temptag = document.createElement("span");
                temptag.className = "nazeka_num";
                temptag.textContent = ""+(j+1)+".";
                definition.appendChild(temptag);
                definition.appendChild(document.createTextNode(" "));
            }
            if(sense.inf)
            {
                let info = document.createElement("i");
                info.textContent = "("+sense.inf+") ";
                definition.appendChild(info);
            }
            if(sense.misc)
            {
                let temptag = document.createElement("span");
                temptag.className = "nazeka_misc";
                let temptext = "(";
                let parts = [];
                for(let l = 0; l < sense.misc.length; l++)
                    parts.push(sense.misc[l].substring(1, sense.misc[l].length-1));
                temptext += parts.join(", ");
                temptext += ")";
                temptag.textContent = temptext;
                definition.appendChild(temptag);
                definition.appendChild(document.createTextNode(" "));
            }
            definition.appendChild(document.createTextNode(sense.gloss.join("; ")));
            if(settings.compact)
            {
                if(sense.gloss.length > 1 || j+1 != goodsenses.length)
                    definition.appendChild(document.createTextNode("; "));
            }
            else
            {
                definition.appendChild(document.createElement("br"));
            }
        }
        container.appendChild(definition);
        temp.appendChild(container);
    }
    return temp;
}

function build_div_intermediary()
{
    let middle = document.createElement("div");
    let inner = document.createElement("div");
    inner.className = "nazeka_listing";
    middle.appendChild(inner);
    return middle;
}

function build_div (text, result)
{
    last_displayed = [{text:text, result:result}];
    let middle = build_div_intermediary();
    middle.firstChild.appendChild(build_div_inner(text, result));
    return middle;
}
function build_div_compound (results)
{
    last_displayed = results;
    //console.log("Displaying:");
    //print_object(result);
    let middle = build_div_intermediary();
    for(let lookup of results)
        middle.firstChild.appendChild(build_div_inner(lookup.text, lookup.result));
    return middle;
}

async function settings_init()
{
    try
    {
        async function getvar(name, defval)
        {
            let temp = (await browser.storage.local.get(name))[name];
            if(temp == undefined)
                temp = defval;
            settings[name] = temp;
        }
        getvar("enabled", false);
        getvar("compact", true);
        getvar("length", 25);
        getvar("scale", 1);
        getvar("width", 600);
        getvar("lookuprate", 8);
        getvar("fixedwidth", false);
        getvar("fixedwidthpositioning", false);
        getvar("superborder", false);
        getvar("showoriginal", true);
        
        getvar("bgcolor", "#111111");
        getvar("fgcolor", "#CCCCCC");
        getvar("hlcolor", "#99DDFF");
        getvar("font", "");
        getvar("hlfont", "");
        
        getvar("alternatives_mode", 0);
        getvar("strict_alternatives", true);
        
        if(!settings.enabled && exists_div())
            delete_div();
    } catch(err) {} // options not stored yet
}

settings_init();

browser.storage.onChanged.addListener((updates, storageArea) =>
{
    if(storageArea != "local") return;
    for(let setting of Object.entries(updates))
    {
        let option = setting[0];
        let value = setting[1];
        if(Object.keys(settings).includes(option))
            settings[option] = value.newValue;
    }
    if(!settings.enabled && exists_div())
        delete_div();
});

// look up words on a timer loop that only uses the most recent lookup request and ignores all the others

let lookup_timer = undefined;
let lookup_queue = [];
//let lookup_rate = 8;

let lookup_loop_cancel = false;
let lookup_last_time = Date.now();

async function lookup_loop()
{
    //console.log("running lookup queue");
    lookup_last_time = Date.now();
    let t_start = Date.now();
    if(lookup_queue.length > 0)
    {
        //console.log("queue not empty");
        let lookup = lookup_queue.pop();
        lookup_queue = [];
        //console.log("asking background to search the dictionary");
        let response = await browser.runtime.sendMessage({type:"search", text:lookup[0], time:Date.now(), divexisted:exists_div(), alternatives_mode:settings.alternatives_mode, strict_alternatives:settings.strict_alternatives});
        //console.log("got response");
        if(response)
        {
            if(!response.length)
            {
                let mydiv = build_div(response.text, response.result);
                if(mydiv)
                    display_div(mydiv, lookup[3], lookup[4]);
            }
            else
            {
                let mydiv = build_div_compound(response);
                if(mydiv)
                    display_div(mydiv, lookup[3], lookup[4]);
            }
        }
    }
    let t_end = Date.now();
    let t_to_wait = settings.lookuprate - (t_end - t_start);
    if(t_to_wait < 0) t_to_wait = 0;
    if(t_to_wait > settings.lookuprate) t_to_wait = settings.lookuprate;
    
    if(lookup_loop_cancel)
    {
        //console.log("queue setup");
        lookup_loop_cancel = false;
        lookup_timer = undefined;
        return;
    }
    else
        lookup_timer = setTimeout(lookup_loop, t_to_wait);
}

lookup_timer = setTimeout(lookup_loop, settings.lookuprate);

function lookup_enqueue(text, x, y, x2, y2)
{
    //console.log("trying to enqueue lookup");
    lookup_queue = [[text, x, y, x2, y2]];
    //console.log("enqueued lookup");
    if(!lookup_timer || lookup_last_time+settings.lookuprate*100 < Date.now())
    {
        if(lookup_timer)
            clearTimeout(lookup_timer);
        lookup_timer = setTimeout(lookup_loop, settings.lookuprate);
    }
}

function lookup_cancel()
{
    //console.log("cancelling lookup");
    lookup_queue = [];
    delete_div();
}

let time_of_last = Date.now();

let seach_x_offset = -3;

function update(event)
{
    if(!settings.enabled) return;
    
    if(Date.now() - time_of_last < settings.lookuprate)
    {
        //console.log("too soon, returning");
        //console.log(Date.now() + " vs " + time_of_last);
        return;
    }
    
    //console.log("---- entry to word lookup at " + Date.now());
    time_of_last = Date.now();
    //console.log("searching for text");
    let textNode;
    let offset;
    
    let nodeResetList = [];
    let nodeResetSeen = new Set();
    
    function acceptable_element(node)
    {
        if(!textNode) return false;
        //console.log(node);
        if(textNode.nodeType != 1)
            return false;
        if(textNode.tagName.toLowerCase() == "textarea")
            return true;
        if(textNode.tagName.toLowerCase() == "input")
            if(["search", "submit", "text", "url"].includes(node.type.toLowerCase()))
                return true;
        return false;
    }
    // find the text under the mouse event
    let nodeIsBad  = true;
    while(nodeIsBad)
    {
        nodeIsBad = false;
        
        let hitpage = function(x, y)
        {
            let range = undefined;
            if (document.caretPositionFromPoint)
                range = document.caretPositionFromPoint(x, y);
            else if (document.caretRangeFromPoint)
                range = document.caretRangeFromPoint(x, y);
            if(range)
            {
                textNode = range.offsetNode;
                offset = range.offset;
            }
        };
        
        hitpage(event.clientX+seach_x_offset, event.clientY);
        // try without the offset
        if (textNode == undefined || (textNode.nodeType != 3 && !acceptable_element(textNode)))
            hitpage(event.clientX, event.clientY);
        
        if(!(textNode == undefined))
        {
            // we hit an node, see if it's a transparent element and try to move it under everything temporarily if it is
            try
            {
                if(textNode.nodeType == 1 && !nodeResetSeen.has(textNode) && !acceptable_element(textNode))
                {
                    let style = window.getComputedStyle(textNode);
                    let bg_color = style.getPropertyValue("background-color"); 
                    if(bg_color == "rgba(0, 0, 0, 0)")
                    {
                        nodeIsBad = true;
                        nodeResetList.push([textNode, style.getPropertyValue("z-index")]);
                        nodeResetSeen.add(textNode);
                        textNode.style.zIndex = -100000000;
                        continue;
                    }
                }
            } catch(err) {}
        }
    }
    for(let toreset of nodeResetList)
    {
        let element = toreset[0];
        let z_index = toreset[1];
        element.style.zIndex = z_index;
    }
    // if there was text, use it
    let elemental = acceptable_element(textNode);
    if (textNode && (textNode.nodeType == 3 || elemental))
    {
        //print_object(textNode);
        //print_object(textNode.parentNode);
    
        let rect = undefined;
        let fud = 5;
        if(elemental)
            rect = textNode.getBoundingClientRect();
        else
            rect = textNode.parentNode.getBoundingClientRect();
        
        // FIXME: Doesn't work to reject in all cases
        let hit = (event.clientX+fud >= rect.left && event.clientX-fud <= rect.right && event.clientY+fud >= rect.top && event.clientY-fud <= rect.bottom);
        if(!hit)
        {
            lookup_cancel();
            return;
        }
        //console.log("found text");
        let text = "";
        if(elemental)
            text = textNode.value.substring(offset, textNode.value.length);
        else
            text = textNode.textContent.substring(offset, textNode.textContent.length);
        
        // grab text from later and surrounding DOM nodes
        let current_node = textNode;
        while(text.length < settings.length)
        {
            if(current_node == undefined) break;
            try
            {
                let display = getComputedStyle(current_node).display;
                if(display != "inline" && display != "ruby")
                    break;
            } catch(err) {}
            
            let parent = current_node.parentNode;
            if(parent == undefined) break;
            let i = Array.prototype.indexOf.call(current_node.parentNode.childNodes, current_node);
            if(i < 0) break;
            i++;
            while(i < current_node.parentNode.childNodes.length)
            {
                let next_node = current_node.parentNode.childNodes[i++];
                let tagname = next_node.tagName ? next_node.tagName.toLowerCase() : "";
                
                if(tagname == "rt" || tagname == "rp")
                    continue;
                // next_node might not be an Element
                try
                {
                    let display = getComputedStyle(next_node).display;
                    if(display == "ruby")
                        continue;
                    if(display == "inline")
                        text += next_node.textContent;
                }
                catch(err)
                {
                    text += next_node.textContent;
                }
            }
            if(text.length < settings.length)
                current_node = current_node.parentNode;
            
        }
        
        text = text.trim();
        //print_object(text);
        text = text.substring(0, Math.min(text.length, settings.length));
        
        //if(text != "")
            //lookup_indirect(text, event.clientX, event.clientY, time_of_last);
        if(text != "")
        {
            //console.log("calling lookup_enqueue");
            lookup_enqueue(text, event.clientX, event.clientY, event.pageX, event.pageY);
        }
        else
        {
//             console.log("no text");
            lookup_cancel();
        }
    }
    else
    {
//         console.log("no text node");
//         console.log("actual type:");
//         console.log(textNode.nodeType);
//         console.log("offset:");
//         console.log(offset);
        lookup_cancel();
    }
}

function update_touch(event)
{
    //console.log("touch event triggered");
    if(event.touches)
    {
        //console.log("receiving touch event");
        update(event.touches[0]);
    }
}

function message(text)
{
    if(!text) return;
    let mydiv = document.createElement("div");
    mydiv.style = "background-color: rgba(0, 0, 0, 0.5); color: white; width: 200px; position: fixed; right: 25px; bottom: 25px; z-index: 100000; padding: 5px; border-radius: 3px;"
    mydiv.textContent = text;
    document.body.appendChild(mydiv);
    
    function delete_later()
    {
        mydiv.remove();
    }
    
    setTimeout(delete_later, 3000);
}

async function mine_to_storage(object)
{
    let cards = (await browser.storage.local.get("cards")).cards;
    if(!cards)
        cards = [];
    console.log(cards);
    cards.push(object);
    browser.storage.local.set({cards:cards});
}

function mine(highlight)
{
    let front = highlight.textContent;
    let word = highlight.parentElement.parentElement;
    let readings = "";
    let readings_elements = word.getElementsByClassName("nazeka_readings");
    if(readings_elements.length)
        readings = readings_elements[0].textContent;
    let definitions = word.getElementsByClassName("nazeka_definitions")[0].textContent;
    let seq = word.getAttribute("nazeka_seq");
    
    console.log(front);
    console.log(readings);
    console.log(definitions);
    console.log(seq);
    
    mine_to_storage({front: front, readings: readings, definitions: definitions, seq: seq});
}

function keytest(event)
{
    if(event.shiftKey || event.ctrlKey || event.metaKey || event.altKey)
        return;
    if(!exists_div())
        return;
    console.log("key");
    console.log(event.key);
    if(event.key == "m")
    {
        console.log("mining request");
        let mydiv = document.body.getElementsByClassName(div_class)[0].cloneNode(true);
        delete_div();
        mydiv.style.position = "fixed";
        mydiv.style.left = "unset";
        mydiv.style.top = "10px";
        mydiv.style.right = "10px";
        mydiv.className = "nazeka_mining_ui";
        let newheader = document.createElement("div");
        newheader.textContent = "Mining UI. Press the given entry to mine it, or this message to cancel.";
        newheader.addEventListener("click", ()=>
        {
            while(document.body.getElementsByClassName("nazeka_mining_ui").length)
                document.body.getElementsByClassName("nazeka_mining_ui")[0].remove();
        });
        mydiv.firstChild.firstChild.prepend(newheader);
        mydiv.style.zIndex = 100000-1;
        
        for(let keb of mydiv.getElementsByClassName("nazeka_main_keb"))
        {
            keb.addEventListener("click", (event)=>
            {
                mine(event.target);
                while(document.body.getElementsByClassName("nazeka_mining_ui").length)
                    document.body.getElementsByClassName("nazeka_mining_ui")[0].remove();
            });
        }
        for(let reb of mydiv.getElementsByClassName("nazeka_main_reb"))
        {
            reb.addEventListener("click", (event)=>
            {
                mine(event.target);
                while(document.body.getElementsByClassName("nazeka_mining_ui").length)
                    document.body.getElementsByClassName("nazeka_mining_ui")[0].remove();
            });
        }
        
        document.body.appendChild(mydiv);
    }
}

window.addEventListener("mousemove", update);
window.addEventListener("keydown", keytest);
document.addEventListener("touchstart", update_touch);

