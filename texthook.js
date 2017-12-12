// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

/*
 * TODO:
 * 
 * ! Finish porting the underlay's deconjugation rules
 * ! Definition priority handling (prefer words with any commonness tags, shorter deconjugations, expressions, non-archaic/non-obscure words, high frequencies)
 * - Fix katakana-hiragana matching (only happens in lookups right now, not display generation)
 * - More configurability
 * - VNstats frequency data
 * - Load deconjugation rules from an advanced setting, with a reset button
 * - Work with text input fields
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
};

let last_time_display = Date.now();

let div_class = "nazeka_fGKRTDGFGgr9atT";

function delete_div ()
{
    let other = document.body.getElementsByClassName(div_class);
    if(other.length > 0)
    {
        other[0].style.visibility = "hidden";
        if(other[0].children.length > 0)
            other[0].children[0].innerHTML = "";
    }
}

function display_div (middle, x, y, time)
{
    middle.style = "background-color: #111; border-radius: 2.5px; border: 1px solid #111;";
    middle.firstChild.style = "border: 1px solid white; border-radius: 2px; padding: 2px; background-color: #111; color: #CCC; font-family: Arial, sans-serif; font-size: 13px; text-align: left;";
    
    let other = document.body.getElementsByClassName(div_class);
    if(other.length > 0)
    {
        other[0].replaceChild(middle, other[0].firstChild);
        
        let styletext = "max-width: 600px; position: absolute; top: " + (y+5) + "px; left: " + (x+5) + "px;";
        styletext += "background-color: white; border-radius: 3px; border: 1px solid white; z-index: 100000;";
        other[0].style = styletext;
        
        other[0].style.visibility = "visible";
    }
    else
    {
        let outer = document.createElement("div");
        outer.className = div_class;
        let styletext = "max-width: 600px; position: absolute; top: " + (y+5) + "px; left: " + (x+5) + "px;";
        styletext += "background-color: white; border-radius: 3px; border: 1px solid white; z-index: 100000;";
        outer.style = styletext;
        
        outer.appendChild(middle);
        
        document.body.appendChild(outer);
    }
}

function exists_div()
{
    let other = document.body.getElementsByClassName(div_class);
    return (other.length > 0 && other[0].style.visibility != "hidden");
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

// FIXME: redundant garbage, find a way to deduplicate a lot of the logical parts of this
function build_div (text, result)
{
    //console.log("Displaying:");
    //print_object(result);
    let middle = document.createElement("div");
    let temp = document.createElement("div");
    temp.innerHTML +=
"<style>\
.nazeka_main_keb{font-family: IPAGothic,TakaoGothic,Noto Sans CJK JP Regular,Meiryo,sans-serif;font-size:18px;color:#9DF}\
.nazeka_main_reb{font-family: IPAGothic,TakaoGothic,Noto Sans CJK JP Regular,Meiryo,sans-serif;font-size:18px;color:#9DF}\
</style>";
    //temp.innerHTML += "Looked up " + text + "<br>";
    // lookups can have multiple results (e.g. する -> 為る, 刷る, 掏る, 剃る, 擦る)
    // FIXME: A bunch of code here depends on the literal text used to run the search instead of the text with which the search succeeded.
    // The search can convert between hiragana and katakana to find a valid match, so we should know what text it actually used.
    for(let i = 0; i < result.length; i++)
    {
        let term = result[i];
        if(term.deconj.size > 0)
            text = term.deconj.values().next().value.text;
        //print_object(term);
        let temptag = "<span class=nazeka_word>";
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
                temptag += "<span class=nazeka_main_keb>"
                temptag += kanji_text;
                temptag += "</span>"
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
                    for(let form of term.deconj)
                    {
                        if(form.process.length > 0)
                            temptag += "～";
                        for(let f = form.process.length-1; f >= 0; f--)
                        {
                            let info = form.process[f];
                            if(info.startsWith("(") && info.endsWith(")") && f != 0)
                                continue;
                            temptag += info;
                            if(f > 0)
                                temptag += "―";
                        }
                    }
                }
                temptag += " 《";
                for(let j = 0; j < readings.length; j++)
                {
                    temptag += readings[j].reb;
                    if(readings[j].inf)
                    {
                        for(let info of readings[j].inf)
                        {
                            temptag += " <span class=nazeka_reb_inf>(";
                            temptag += clip(info);
                            temptag += ")</span>";
                        }
                    }
                    if(j+1 != readings.length)
                        temptag += "・";
                }
                temptag += "》";
                
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
                    temptag += " (also ";
                for(let j = 0; j < alternatives.length; j++)
                {
                    temptag += alternatives[j].keb;
                    if(alternatives[j].inf)
                    {
                        for(let info of alternatives[j].inf)
                        {
                            temptag += " <span class=nazeka_keb_inf>(";
                            temptag += clip(info);
                            temptag += ")</span>";
                        }
                    }
                    if(j+1 < alternatives.length)
                        temptag += ", ";
                }
                if(alternatives.length > 0)
                    temptag += ")";
            }
        }
        else
            found_kanji = false;
        if(!found_kanji)
        {
            temptag += "<span class=nazeka_main_reb>"
            temptag += text;
            temptag += "</span>"
            // FIXME: show inf for located reb
            if(term.deconj)
            {
                for(let form of term.deconj)
                {
                    if(form.process.length > 0)
                        temptag += "～";
                    for(let f = form.process.length-1; f >= 0; f--)
                    {
                        let info = form.process[f];
                        if(info.startsWith("(") && info.endsWith(")") && f != 0)
                            continue;
                        temptag += info;
                        if(f > 0)
                            temptag += "―";
                    }
                }
            }
            
            // list alternatives
            let alternatives = [];
            
            for(let j = 0; j < term.r_ele.length; j++)
                if(term.r_ele[j].reb != text)
                    alternatives.push(term.r_ele[j]);
            
            if(alternatives.length > 0)
                temptag += " (also ";
            for(let j = 0; j < alternatives.length; j++)
            {
                temptag += alternatives[j].reb;
                if(alternatives[j].inf)
                {
                    for(let info of alternatives[j].inf)
                    {
                        temptag += " <span class=nazeka_reb_inf>(";
                        temptag += clip(info);
                        temptag += ")</span>";
                    }
                }
                if(j+1 < alternatives.length)
                    temptag += ", ";
            }
            if(alternatives.length > 0)
                temptag += ")";
        }
        temptag += "</span>";
        temp.innerHTML += temptag;
        temp.innerHTML += "<br>";
        
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
        for(let j = 0; j < goodsenses.length; j++)
        {
            let sense = goodsenses[j];
            
            if(sense.pos == lastpos)
                sense.pos = undefined;
            else
                lastpos = sense.pos;
            
            //temp.innerHTML += "<span class=num>" + (j+1) + ".</span> ";
            if(sense.pos)
            {
                let temptag = "<span class=nazeka_pos>(";
                let parts = [];
                for(let l = 0; l < sense.pos.length; l++)
                    parts.push(sense.pos[l]);
                temptag += parts.join(", ");
                temptag += ")</span>";
                if(settings.compact)
                    temptag += " ";
                else
                    temptag  += "<br>";
                temp.innerHTML += temptag;
            }
            if(settings.compact)
            {
                if(goodsenses.length > 1)
                    temp.innerHTML += " <span class=nazeka_num>(" + (j+1) + ")</span> ";
            }
            else
            {
                temp.innerHTML += "<span class=nazeka_num>" + (j+1) + ".</span> ";
            }
            if(sense.inf)
                temp.innerHTML += "<i>(" + sense.inf + ")</i> ";
            if(sense.misc)
            {
                let temptag = "<span class=nazeka_misc>(";
                let parts = [];
                for(let l = 0; l < sense.misc.length; l++)
                    parts.push(sense.misc[l].substring(1, sense.misc[l].length-1));
                temptag += parts.join(", ");
                temptag += ")</span>";
                temptag += " ";
                temp.innerHTML += temptag;
            }
            temp.innerHTML += sense.gloss.join("; ");
            if(settings.compact)
            {
                if(sense.gloss.length > 1 || j+1 != goodsenses.length)
                    temp.innerHTML += "; ";
            }
            else
            {
                temp.innerHTML += "<br>";
            }
        }
        if(settings.compact)
            temp.innerHTML += "<br>";
    }
    middle.appendChild(temp);
    return middle;
}


let settings_reload_rate = 200;
let settings_reloader = undefined;
async function settings_reload()
{
    try
    {
        settings.enabled = (await browser.storage.local.get("enabled")).enabled;
        if(settings.enabled == undefined)
            settings.enabled = false;
        settings.compact = (await browser.storage.local.get("compact")).compact;
        if(settings.compact == undefined)
            settings.compact = true;
        //console.log("set settings");
        //console.log(settings.enabled);
        //console.log(settings.compact);
    }
    catch(error)
    {
        console.log("failed to set settings, maybe not stored yet?");
    } // not stored yet, probably
    
    settings_reloader = setTimeout(settings_reload, settings_reload_rate);
}

settings_reloader = setTimeout(settings_reload, settings_reload_rate);

// look up words on a timer loop that only uses the most recent lookup request and ignores all the others

let lookup_timer = undefined;
let lookup_queue = [];
let lookup_rate = 8;

let lookup_loop_cancel = false;
let lookup_last_time = Date.now();

async function lookup_loop()
{
    lookup_last_time = Date.now();
    let t_start = Date.now();
    if(lookup_queue.length > 0)
    {
        //console.log("queue not empty");
        let lookup = lookup_queue.pop();
        lookup_queue = [];
        let response = await browser.runtime.sendMessage({type:"search", text:lookup[0], time:Date.now()});
        if(response)
        {
            let mydiv = build_div(response.text, response.result);
            if(mydiv)
                display_div(mydiv, lookup[3], lookup[4]);
        }
    }
    let t_end = Date.now();
    let t_to_wait = lookup_rate - (t_end - t_start);
    if(t_to_wait < 0) t_to_wait = 0;
    if(t_to_wait > lookup_rate) t_to_wait = lookup_rate;
    
    if(lookup_loop_cancel)
    {
        lookup_loop_cancel = false;
        lookup_timer = undefined;
        return;
    }
    else
        lookup_timer = setTimeout(lookup_loop, t_to_wait);
}

lookup_timer = setTimeout(lookup_loop, lookup_rate);

function lookup_enqueue(text, x, y, x2, y2)
{
    lookup_queue = [[text, x, y, x2, y2]];
    if(!lookup_timer || lookup_last_time+lookup_rate*100 < Date.now())
    {
        if(lookup_timer)
            clearTimeout(lookup_timer);
        lookup_timer = setTimeout(lookup_loop, lookup_rate);
    }
}

function lookup_cancel()
{
    lookup_queue = [];
    delete_div();
}

let max_search_len = 25;
let time_of_last = Date.now();
let throttle = 8;

let seach_x_offset = -3;

window.addEventListener("mousemove", (event)=>
{
    if(!settings.enabled) return;
    
    if(Date.now() - time_of_last < throttle)
    {
        //console.log("too soon, returning");
        //console.log(Date.now() + " vs " + time_of_last);
        return;
    }
    //console.log("---- mousemove entry at " + Date.now());
    time_of_last = Date.now();
    //console.log("searching for text");
    let textNode;
    let offset;
    // find the text under the mouse event
    if (document.caretPositionFromPoint)
    {
        let range = document.caretPositionFromPoint(event.clientX+seach_x_offset, event.clientY);
        if(range)
        {
            textNode = range.offsetNode;
            offset = range.offset;
        }
    }
    else if (document.caretRangeFromPoint)
    {
        let range = document.caretRangeFromPoint(event.clientX+seach_x_offset, event.clientY);
        if(range)
        {
            textNode = range.startContainer;
            offset = range.startOffset;
        }
    }
    
    // try without the offset
    if (textNode == undefined || textNode.nodeType != 3)
    {
        if (document.caretPositionFromPoint)
        {
            let range = document.caretPositionFromPoint(event.clientX, event.clientY);
            if(range)
            {
                textNode = range.offsetNode;
                offset = range.offset;
            }
        }
        else if (document.caretRangeFromPoint)
        {
            let range = document.caretRangeFromPoint(event.clientX, event.clientY);
            if(range)
            {
                textNode = range.startContainer;
                offset = range.startOffset;
            }
        }
    }
    // if there was text, use it
    if (textNode && textNode.nodeType == 3)
    {
        //print_object(textNode);
        //print_object(textNode.parentNode);
        let rect = textNode.parentNode.getBoundingClientRect();
        let fud = 5;
        // FIXME: Doesn't work to reject in all cases
        let hit = (event.clientX+fud >= rect.left && event.clientX-fud <= rect.right && event.clientY+fud >= rect.top && event.clientY-fud <= rect.bottom);
        if(!hit)
        {
            lookup_cancel();
            return;
        }
        //console.log("found text");
        let text = textNode.textContent.substring(offset, textNode.textContent.length);
        
        // grab text from later and surrounding DOM nodes
        let current_node = textNode;
        while(text.length < max_search_len)
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
                let next_node = current_node.parentNode.childNodes[i];
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
                i++;
            }
            if(text.length < max_search_len)
                current_node = current_node.parentNode;
            
        }
        
        text = text.trim();
        //print_object(text);
        text = text.substring(0, Math.min(text.length, max_search_len));
        
        //if(text != "")
            //lookup_indirect(text, event.clientX, event.clientY, time_of_last);
        if(text != "")
            lookup_enqueue(text, event.clientX, event.clientY, event.pageX, event.pageY);
        else
            lookup_cancel();
    }
    else
        lookup_cancel();
});


