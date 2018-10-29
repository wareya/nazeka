// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

/*
 * TODO:
 * 
 * ! Finish porting the underlay's deconjugation rules
 * - Add an option for "hide unfitting senses/spellings/readings" vs "show everything but with details about what can be what"
 * - Fix katakana-hiragana matching (only happens in lookups right now, not display generation)
 * - More configurability
 * - VNstats frequency data
 * - Integrate frequency into priority handling
 * - Load deconjugation rules from an advanced setting, with a reset button
 * ? Export/import settings with json
 * 
 */

'use strict';

// updated by a timer looping function, based on local storage set by the options page
let settings = {
enabled: false,
compact: true,
usetextfields: true,
length: 25,
contextlength: 100, // nonconfigurable
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
hlcolor2: "#99FF99",
font: "",
hlfont: "",
corner: 0,
xoffset: 5,
yoffset: 22,
ignore_linebreaks: false,
sticky: false,
popup_follows_mouse: true,
popup_requires_key: 0, // 0: none; 1: ctrl; 2: shift
x_dodge: 1,
y_dodge: 0,
sticky_maxheight: 0,
hotkey_mine: "m",
hotkey_close: "n",
hotkey_sticky: "b",
hotkey_audio: "p",
hotkey_nudge_left: "ArrowLeft",
hotkey_nudge_right: "ArrowRight",
volume: 0.2,
};

let platform = "win";

async function get_real_platform()
{
    
    let my_platform = undefined;
    try {
        my_platform = await browser.runtime.sendMessage({type:"platform"});
    }catch(err){}
    while(my_platform == "")
    {
        try {
            my_platform = await browser.runtime.sendMessage({type:"platform"});
        }catch(err){}
    }
    platform = my_platform;
}
get_real_platform();

let last_time_display = Date.now();

// FIXME: this should be the extension ID or a per-page random string, but it's not useful to change this yet, not until firefox lands shadow DOM
let div_class = "nazeka_fGKRTDGFGgr9atT";

// the popup is inserted into the page as a screen-relative div, we never delete it because modifying the root DOM of very long pages is expensive, we hide it instead
let last_displayed = undefined;
function delete_div()
{
    last_displayed = undefined;
    let other = get_div();
    if(other)
    {
        other.innerHTML = "";
        other.removeAttribute('style');
        /*
        other.style.display = "none";
        if(other.children.length > 0)
            other.children[0].innerHTML = "";
        other.style.position = "relative";
        */
    }
}

function set_sticky_styles(mydiv)
{
    mydiv.style.position = "fixed";
    mydiv.style.left = "unset";
    mydiv.style.right= "unset";
    mydiv.style.bottom = "unset";
    mydiv.style.top = "10px";
    if(settings.corner != 1 && settings.corner != 3)
        mydiv.style.right = "10px";
    else
        mydiv.style.left = "10px";
    mydiv.style.marginRight = "unset";
    if(settings.sticky_maxheight == 0)
        mydiv.style.maxHeight = "calc(100vh - 20px)";
    else
        mydiv.style.maxHeight = Math.round(Number(settings.sticky_maxheight))+"px";
    mydiv.style.overflowY = "scroll";
    mydiv.style.marginLeft = "unset";
    mydiv.style.marginTop = "unset";
    mydiv.style.marginBottom = "10px";
}

function get_doc()
{
    let find_root = window;
    let mydoc = document;
    while(find_root.parent && find_root.parent != find_root && find_root.parent.document.body.tagName != "FRAMESET")
    {
        find_root = find_root.parent;
        try
        {
            mydoc = find_root.document;
        }
        catch(err) {}
    }
    return mydoc;
}

function getViewportSize(mydoc)
{
    if (mydoc.compatMode == "CSS1Compat")
        return { w: mydoc.documentElement.clientWidth, h: mydoc.documentElement.clientHeight };
    return { w: mydoc.body.clientWidth, h: mydoc.body.clientHeight };
}

// here we set all the styling and positioning of the div, passing "middle" as the actual contents of it.
// this is rather elaborate because of 1) a lack of shadow DOM, even for just styling 2) options 3) """features""" of how HTML viewport stuff works that are actually terrible
let last_display_x = 0;
let last_display_y = 0;
function display_div(middle, x, y)
{
    last_display_x = x;
    last_display_y = y;
    let font = settings.font.trim().replace(";","").replace("}","");
    if(font != "")
        font += ",";
    middle.style = `background-color: ${settings.bgcolor}; border-radius: 2.5px; border: 1px solid ${settings.bgcolor};`;
    middle.firstChild.style = `border: 1px solid ${settings.fgcolor}; border-radius: 2px; padding: 2px; background-color: ${settings.bgcolor}; color: ${settings.fgcolor}; font-family: ${font} Arial, sans-serif; font-size: 13px; text-align: left;`;
    
    let find_root = window;
    let newx = x;
    let newy = y;
    let mydoc = document;
    while(find_root.parent && find_root.parent != find_root && find_root.parent.document.body.tagName != "FRAMESET")
    {
        let rect = find_root.frameElement.getBoundingClientRect();
        //let rx = find_root.offsetLeft;//rect.x;
        //let ry = find_root.offsetTop;//rect.y;
        let rx = rect.x;
        let ry = rect.y;
        let sx1 = find_root.parent.scrollX;
        let sy1 = find_root.parent.scrollY;
        let sx2 = find_root.scrollX;
        let sy2 = find_root.scrollY;
        find_root = find_root.parent;
        newx += (rx + sx1 - sx2);
        newy += (ry + sy1 - sy2);
        try
        {
            mydoc = find_root.document;
        } catch(err) {}
    }
    
    // compensate for body being relative if it is, because our popup is absolute
    let relative_body = getComputedStyle(mydoc.body).position == "relative";
    if(relative_body)
    {
        let rect = mydoc.body.getBoundingClientRect();
        newx -= rect.x;
        newy -= rect.y;
        // overcompensate for scrolling
        newx -= mydoc.scrollingElement.scrollLeft;
        newy -= mydoc.scrollingElement.scrollTop;
    }
    
    let basewidth = Math.round(Number(settings.width));
    if(settings.x_dodge != 1 && basewidth > mydoc.documentElement.getBoundingClientRect().width/2 - settings.xoffset - 5)
        basewidth = Math.max(150, Math.round(mydoc.documentElement.getBoundingClientRect().width/2 - settings.xoffset - 5));
    
    let styletext = "";
    if(settings.fixedwidth)
    {
        styletext += "max-width: " + basewidth + "px; "
        styletext += "min-width: " + basewidth + "px; "
    }
    else
    {
        styletext += "max-width: " + basewidth + "px; "
        styletext += "min-width: 150px; "
    }
    styletext += "position: absolute; top: 0; left: 0; transition: unset; ";
    
    if(settings.superborder)
        styletext += `background-color: ${settings.fgcolor}; border-radius: 3px; border: 1px solid ${settings.fgcolor}; z-index: 1000000000000000000000;`;
    else
        styletext += `border-radius: 3px; background-color: ${settings.bgcolor}; z-index: 1000000000000000000000;`;
    
    styletext += "writing-mode: horizontal-tb; line-height: initial; white-space: initial;";
    
    let other = mydoc.body.getElementsByClassName(div_class);
    let outer = undefined;
    if(other.length > 0)
    {
        outer = other[0];
        if(!outer.firstChild)
            outer.appendChild(middle);
        else if(outer.firstChild != middle)
            outer.replaceChild(middle, outer.firstChild);
        outer.style.display = "block";
    }
    else
    {
        outer = mydoc.createElement("div");
        outer.className = div_class;
        if(!outer.firstChild || outer.firstChild != middle)
            outer.appendChild(middle);
        mydoc.body.appendChild(outer);
    }
    
    outer.lang = "ja";
    
    if(settings.scale != 1 && settings.scale > 0 && settings.scale < 64)
        styletext += " transform-origin: top left; transform: scale(" + Number(settings.scale) + ");";
    
    outer.style = styletext;
    
    let mywidth = basewidth*settings.scale;
    if(!settings.fixedwidthpositioning)
        mywidth = outer.offsetWidth*settings.scale;
    
    let corner = settings.corner;
    
    if(settings.sticky && platform != "android" && get_doc().body.getElementsByClassName("nazeka_mining_ui").length == 0)
        set_sticky_styles(outer);
    else
    {
        if(corner == 1 || corner == 3)
        {
            newx -= mywidth;
            newx -= settings.xoffset;
        }
        else
            newx += settings.xoffset;
        
        if(corner == 2 || corner == 3)
            newy = newy - outer.getBoundingClientRect().height - settings.yoffset;
        else
            newy = newy + settings.yoffset;
        
        // fixes an absolute positioning """feature""" that doesn't work properly with very wide pages (e.g. pages of left-to-right vertical text)
        outer.style.top = "0px";
        outer.style.left = "0px";
        let width = outer.offsetWidth;
        //
        
        outer.style.top = (newy)+"px";
        outer.style.bottom = "unset";
        outer.style.right = "unset";
        outer.style.left = (newx)+"px";
        outer.style.marginRight = "unset";
        outer.style.marginLeft = "unset";
        
        // fixes an absolute positioning """feature""" that doesn't work properly with very wide pages (e.g. pages of left-to-right vertical text)
        outer.style.width = (width)+"px";
        //
    }
    
    let localrect;
    let dodged_vertically = false;
    let viewport = getViewportSize(mydoc);
    
    // dodge top/bottom
    localrect = outer.getBoundingClientRect();
    if(localrect.bottom+5 > viewport.h)
    {
        if(settings.y_dodge == 1) // slide
            newy -= localrect.bottom+5 - viewport.h;
        else // flip
            newy -= localrect.height + settings.yoffset*2;
        outer.style.top = (newy)+"px";
        dodged_vertically = true;
    }
    localrect = outer.getBoundingClientRect();
    if(localrect.top-5 < 0 && (!dodged_vertically || corner == 0 || corner == 1)) // (prefer running off the top when using "bottom" alignments)
    {
        if(settings.y_dodge == 1)
            newy -= localrect.top-5;
        else
            newy += localrect.height + settings.yoffset*2;
        outer.style.top = (newy)+"px";
    }
    
    // dodge left/right
    localrect = outer.getBoundingClientRect();
    if(localrect.right+5 > viewport.w)
    {
        if(settings.x_dodge == 1)
            newx -= localrect.right+5 - viewport.w;
        else
            newx -= localrect.width + settings.xoffset*2;
        outer.style.left = (newx)+"px";
    }
    localrect = outer.getBoundingClientRect();
    if(localrect.left-5 < 0)
    {
        if(settings.x_dodge == 1)
            newx -= localrect.left-5;
        else
            newx += localrect.width + settings.xoffset*2;
        outer.style.left = (newx)+"px";
    }
}

function exists_div()
{
    let find_root = window;
    let mydoc = document;
    while(find_root.parent && find_root.parent != find_root)
    {
        find_root = find_root.parent;
        try
        {
            mydoc = find_root.document;
        } catch(err) {}
    }
    
    let other = mydoc.body.getElementsByClassName(div_class);
    return (other.length > 0 && other[0].style.display != "none" && other[0].innerHTML != "");
}

function get_div()
{
    let find_root = window;
    let mydoc = document;
    while(find_root.parent && find_root.parent != find_root)
    {
        find_root = find_root.parent;
        try
        {
            mydoc = find_root.document;
        } catch(err) {}
    }
    
    let other = mydoc.body.getElementsByClassName(div_class);
    if(other.length > 0 && other[0].style.display != "none" && other[0].innerHTML != "")
        return other[0];
    else
        return undefined;
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

// Here we actually build the content of the lookup popup, based on the text we looked up and the list of lookups from the background script
// note that we can get multiple lookups and this function only handles a single lookup
function build_div_inner(text, result, moreText, index, first_of_many = false)
{
    //console.log("building div for " + text);
    //console.log(result);
    let temp = document.createElement("div");
    temp.style.position = "relative";
    // the "Looked up XXXX" text
    if(settings.showoriginal)
    {
        // nesting it like this lets us access nazeka_lookup when we want to get the text we looked up, if we have text in front of it, which we don't anymore
        let original = document.createElement("div");
        original.className = "nazeka_original";
        //original.textContent = "Looked up ";
        let moreText_start = moreText.substring(0, index)
        let moreText_end = moreText.substring(index + text.length);
        if(moreText_start.length > 5)
        {
            moreText_start = "…"+moreText_start.substring(moreText_start.length-3);
        }
        if(moreText_end.length > 5)
        {
            moreText_end = moreText_end.substring(0, 3)+"…";
        }
        //console.log(moreText);
        //console.log(index);
        //console.log(text);
        
        let original_inner = document.createElement("span");
        original_inner.className = "nazeka_lookup";
        original_inner.textContent = text;
        original_inner.style.fontWeight = "bold";
        original_inner.style.color = `${settings.hlcolor}`;
        original.appendChild(document.createTextNode(moreText_start));
        original.appendChild(original_inner);
        original.appendChild(document.createTextNode(moreText_end));
        
        if(first_of_many && (platform == "android" || (settings.sticky && get_doc().body.getElementsByClassName("nazeka_mining_ui").length == 0)))
        {
            let buttons = document.createElement("div");
            let left_arrow = document.createElement("img");
            let right_arrow = document.createElement("img");
            left_arrow.src = browser.extension.getURL("img/leftarrow24.png");
            right_arrow.src = browser.extension.getURL("img/rightarrow24.png");
            left_arrow.onclick = lookup_left;
            right_arrow.onclick = lookup_right;
            left_arrow.style.marginTop = "-3px";
            right_arrow.style.marginTop = "-3px";
            buttons.appendChild(left_arrow);
            buttons.appendChild(right_arrow);
            
            if(platform == "android")
            {
                let close_button = document.createElement("img");
                close_button.src = browser.extension.getURL("img/closebutton24.png");
                close_button.onclick = manual_close;
                close_button.style.marginTop = "-3px";
                buttons.appendChild(close_button);
            }
            buttons.style.float = "right";
            original.appendChild(buttons);
        }
        temp.appendChild(original);
        
        let original_sentence = document.createElement("span");
        original_sentence.className = "nazeka_lookup_sentence";
        original_sentence.textContent = moreText;
        original_sentence.style.display = "none";
        temp.appendChild(original_sentence);
        
        let original_index = document.createElement("span");
        original_index.className = "nazeka_lookup_index";
        original_index.textContent = `${index}`;
        original_index.style.display = "none";
        temp.appendChild(original_index);
    }
    else
    {
        let original_inner = document.createElement("span");
        original_inner.className = "nazeka_lookup";
        original_inner.textContent = text;
        original_inner.style.display = "none";
        temp.appendChild(original_inner);
        
        let original_sentence = document.createElement("span");
        original_sentence.className = "nazeka_lookup_sentence";
        original_sentence.textContent = moreText;
        original_sentence.style.display = "none";
        temp.appendChild(original_sentence);
        
        let original_index = document.createElement("span");
        original_index.className = "nazeka_lookup_index";
        original_index.textContent = `${index}`;
        original_index.style.display = "none";
        temp.appendChild(original_index);
    }
    
    // styling for highlighted stuff and the lookup text
    let style = document.createElement("style");
    style.type = "text/css";
    let font = settings.hlfont.trim().replace(";","").replace("}","");
    if(font != "")
        font += ",";
    if(settings.font.trim().replace(";","").replace("}","") != "")
        font += settings.font.trim().replace(";","").replace("}","") + ",";
    style.textContent =
`.nazeka_main_keb{font-size:18px;white-space:nowrap;font-family: ${font}IPAGothic,TakaoGothic,Noto Sans CJK JP Regular,Meiryo,sans-serif;color:${settings.hlcolor}}
.nazeka_main_reb{font-size:18px;white-space:nowrap;font-family: ${font}IPAGothic,TakaoGothic,Noto Sans CJK JP Regular,Meiryo,sans-serif;color:${settings.hlcolor}}
.nazeka_word * {vertical-align: middle}
.nazeka_sub_keb{font-size:15px;white-space:nowrap;font-family: ${font}IPAGothic,TakaoGothic,Noto Sans CJK JP Regular,Meiryo,sans-serif}
.nazeka_sub_reb{font-size:15px;white-space:nowrap;color:${settings.hlcolor2}}
.nazeka_original{float: right; margin-right: 2px; margin-left:4px; opacity:0.7;}
.epwing_head{margin: 6px 8px 4px;}
.epwing_definition{margin: 0 8px;}
`;
    temp.appendChild(style);
    
    function makespan(text)
    {
        let s = document.createElement("span");
        s.textContent = text;
        return s;
    }
    
    // lookups can have multiple results (e.g. する -> 為る, 刷る, 掏る, 剃る, 擦る)
    for(let i = 0; i < result.length; i++)
    {
        let term = result[i];
        
        let container = document.createElement("div");
        container.className = "nazeka_word_container";
        container.style.marginBottom = "3px";
        container.setAttribute("nazeka_seq", term.seq);
        
        let text = "";
        if(term.found.keb)
            text = term.found.keb;
        else if(term.found.reb)
            text = term.found.reb;
        else
            continue; // shouldn't happen, but again, just in case of broken data
        
        if(term.has_audio.length > 0)
        {
            for(let audio of term.has_audio)
            {
                let audio_data_holder = document.createElement("div");
                audio_data_holder.className = "nazeka_audioref";
                audio_data_holder.style.display = "none";
                audio_data_holder.innerText += audio+"\n";
                container.appendChild(audio_data_holder);
            }
        }
        
        let temptag = document.createElement("span");
        temptag.className = "nazeka_word";
        let original_kana = "";
        if(term.found.reb)
            original_kana = term.found.reb;
        
        if(term.found.keb)
        {
            let k_ele = term.found;
            let kanji_text = k_ele.keb;
            let keb = document.createElement("span");
            keb.className = "nazeka_main_keb";
            keb.textContent = kanji_text;
            temptag.appendChild(keb);
            if(k_ele.inf)
            {
                let maininfos = document.createElement("span");
                maininfos.className = "nazeka_main_infos";
                for(let info of k_ele.inf)
                {
                    let keb_inf = document.createElement("span");
                    keb_inf.className = "nazeka_main_inf";
                    keb_inf.textContent += "(";
                    keb_inf.textContent += clip(info);
                    keb_inf.textContent += ")";
                    maininfos.appendChild(keb_inf);
                }
                temptag.appendChild(maininfos);
            }
            
            // list readings
            let readings = term.r_ele;
            
            temptag.appendChild(document.createElement("wbr"));
            let e_readings = document.createElement("span");
            e_readings.appendChild(makespan("《"));
            e_readings.className = "nazeka_readings";
            for(let j = 0; j < readings.length; j++)
            {
                let subreb = document.createElement("span");
                subreb.className = "nazeka_sub_reb";
                subreb.textContent = readings[j].reb;
                e_readings.appendChild(subreb);
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
                {
                    e_readings.appendChild(document.createElement("wbr"));
                    e_readings.appendChild(makespan("、"));
                }
            }
            e_readings.appendChild(makespan("》"));
            temptag.appendChild(e_readings);
            
            // list alternatives
            let alternatives = [];
            for(let j = 0; j < term.k_ele.length; j++)
                if(term.k_ele[j].keb != kanji_text)
                    alternatives.push(term.k_ele[j]);
            
            if(alternatives.length > 0)
            {
                temptag.appendChild(makespan(" (also "));
            }
            for(let j = 0; j < alternatives.length; j++)
            {
                let subkeb = document.createElement("span");
                subkeb.className = "nazeka_sub_keb";
                subkeb.textContent = alternatives[j].keb;
                temptag.appendChild(subkeb);
                if(alternatives[j].inf)
                {
                    for(let info of alternatives[j].inf)
                    {
                        temptag.appendChild(makespan(" "));
                        let keb_inf = document.createElement("span");
                        keb_inf.className = "nazeka_keb_inf";
                        keb_inf.textContent += "(";
                        keb_inf.textContent += clip(info);
                        keb_inf.textContent += ")";
                        temptag.appendChild(keb_inf);
                    }
                }
                if(j+1 < alternatives.length)
                    temptag.appendChild(makespan(", "));
            }
            if(alternatives.length > 0)
                temptag.appendChild(makespan(")"));
            
            // deconjugations
            
            if(term.deconj)
            {
                //console.log(term.deconj);
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
                        {
                            temptag.appendChild(document.createElement("wbr"));
                            deconj = "～";
                        }
                        else
                        {
                            temptag.appendChild(document.createElement("wbr"));
                            deconj = "；";
                        }
                        temptag.appendChild(makespan(deconj));
                        temptag.appendChild(document.createElement("wbr"));
                        deconj = formtext;
                        temptag.appendChild(makespan(deconj));
                    }
                    first = false;
                }
            }
        }
        else
        {
            let main_reb = document.createElement("span");
            main_reb.className = "nazeka_main_reb";
            main_reb.textContent = term.found.reb;
            temptag.appendChild(main_reb);
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
                temptag.appendChild(makespan(deconj));
            }
            // FIXME wrapper span
            if(term.found.inf)
            {
                let maininfos = document.createElement("span");
                maininfos.className = "nazeka_main_infos";
                for(let info of term.found.inf)
                {
                    let reb_inf = document.createElement("span");
                    reb_inf.className = "nazeka_reb_inf";
                    reb_inf.textContent += "(";
                    reb_inf.textContent += clip(info);
                    reb_inf.textContent += ")";
                    maininfos.appendChild(reb_inf);
                }
                temptag.appendChild(maininfos);
            }
            
            // list alternatives
            let alternatives = [];
            
            for(let j = 0; j < term.r_ele.length; j++)
                if(term.r_ele[j].reb != text)
                    alternatives.push(term.r_ele[j]);
            
            if(alternatives.length > 0)
                temptag.appendChild(makespan(" (also "));
            for(let j = 0; j < alternatives.length; j++)
            {
                temptag.appendChild(makespan(alternatives[j].reb));
                if(alternatives[j].inf)
                {
                    for(let info of alternatives[j].inf)
                    {
                        temptag.appendChild(makespan(" "));
                        let reb_inf = document.createElement("span");
                        reb_inf.className = "nazeka_reb_inf";
                        reb_inf.textContent += "(";
                        reb_inf.textContent += clip(info);
                        reb_inf.textContent += ")";
                        temptag.appendChild(reb_inf);
                    }
                }
                if(j+1 < alternatives.length)
                    temptag.appendChild(makespan(", "));
            }
            if(alternatives.length > 0)
                temptag.appendChild(makespan(")"));
        }
        container.appendChild(temptag);
        container.appendChild(document.createElement("br"));
        
        let goodsenses = term.sense;
        
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
        if(term.epwing)
        {
            definition.appendChild(document.createElement("br"));
            let epwing_head = document.createElement("div");
            epwing_head.appendChild(document.createTextNode("―"+term.epwing["z"]+"―"));
            epwing_head.appendChild(document.createElement("br"));
            let epwing_head_text = term.epwing["r"];
            if(term.epwing["s"] && term.epwing["s"][0] != "")
            {
                let isfirst = true;
                epwing_head_text += "【";
                for(let spelling of term.epwing["s"])
                {
                    if(!isfirst)
                        epwing_head_text += "・";
                    epwing_head_text += spelling;
                    isfirst = false;
                }
                epwing_head_text += "】";
            }
            epwing_head.appendChild(document.createTextNode(epwing_head_text));
            let epwing_definition = document.createElement("div");
            let isfirst = true;
            for(let line of term.epwing["l"])
            {
                if(!isfirst)
                    epwing_definition.appendChild(document.createElement("br"));
                let def_line = document.createElement("span");
                def_line.textContent = line;
                epwing_definition.appendChild(def_line);
                isfirst = false;
            }
            epwing_head.className = "epwing_head";
            epwing_definition.className = "epwing_definition";
            definition.appendChild(epwing_head);
            definition.appendChild(epwing_definition);
        }
        container.appendChild(definition);
        if(settings.corner == 2 || settings.corner == 3)
        {
            if(settings.showoriginal)
                temp.insertBefore(container, temp.children[0].nextSibling);
            else
                temp.insertBefore(container, temp.children[0]);
        }
        else
            temp.appendChild(container);
    }
    return temp;
}

// this are the divs we use to contain the list of lookups. they're all contained in the same inner div from here.
function build_div_intermediary()
{
    let middle = document.createElement("div");
    let inner = document.createElement("div");
    inner.className = "nazeka_listing";
    middle.appendChild(inner);
    return middle;
}

// for popups with single lookup results
let lastMoreText = "";
function build_div (text, result, moreText, index)
{
    lastMoreText = moreText;
    last_displayed = [{text:text, result:result}];
    let middle = build_div_intermediary();
    middle.firstChild.appendChild(build_div_inner(text, result, moreText, index));
    return middle;
}
// for popups with multiple lookup results
function build_div_compound (results, moreText, index)
{
    lastMoreText = moreText;
    last_displayed = results;
    //console.log("Displaying:");
    //print_object(result);
    let middle = build_div_intermediary();
    let first = true;
    for(let lookup of results)
    {
        if(settings.corner == 2 || settings.corner == 3)
            middle.firstChild.insertBefore(build_div_inner(lookup.text, lookup.result, moreText, index, first), middle.firstChild.children[0]);
        else
            middle.firstChild.appendChild(build_div_inner(lookup.text, lookup.result, moreText, index, first));
        first = false;
    }
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
        getvar("hlcolor2", "#66DD44");
        getvar("font", "");
        getvar("hlfont", "");
        
        getvar("alternatives_mode", 0);
        getvar("strict_alternatives", true);
        
        getvar("corner", 0);
        getvar("xoffset", 5);
        getvar("yoffset", 22);
        
        getvar("ignore_linebreaks", false);
        getvar("sticky", false);
        getvar("popup_follows_mouse", true);
        getvar("popup_requires_key", 0);
        
        getvar("x_dodge", 1);
        getvar("y_dodge", 0);
        getvar("sticky_maxheight", 0);
        
        getvar("hotkey_mine", "m");
        getvar("hotkey_close", "n");
        getvar("hotkey_sticky", "b");
        getvar("hotkey_audio", "p");
        getvar("hotkey_nudge_left", "ArrowLeft");
        getvar("hotkey_nudge_right", "ArrowRight");
        getvar("volume", 0.2);
        
        if(!settings.enabled && exists_div())
            delete_div();
        if(!settings.enabled)
        {
            while(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
                get_doc().body.getElementsByClassName("nazeka_mining_ui")[0].remove();
        }
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
    if(!settings.enabled)
    {
        while(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
            get_doc().body.getElementsByClassName("nazeka_mining_ui")[0].remove();
    }
});

// look up words on a timer loop that only uses the most recent lookup request and ignores all the others

let lookup_timer = undefined;
let lookup_queue = [];
//let lookup_rate = 8;

let last_lookup = [];

let last_manual_interaction = Date.now();

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
        last_lookup = lookup;
        //console.log("asking background to search the dictionary");
        let response = await browser.runtime.sendMessage({type:"search", text:lookup[0], time:Date.now(), divexisted:exists_div(), alternatives_mode:settings.alternatives_mode, strict_alternatives:settings.strict_alternatives});
        //console.log("got response");
        if(response && response != "itsthesame")
        {
            if(!response.length)
            {
                let mydiv = build_div(response.text, response.result, lookup[5], lookup[6]);
                if(mydiv)
                    display_div(mydiv, lookup[3], lookup[4]);
            }
            else
            {
                let mydiv = build_div_compound(response, lookup[5], lookup[6]);
                if(mydiv)
                    display_div(mydiv, lookup[3], lookup[4]);
            }
        }
        //else if(response != "itsthesame" && settings.popup_follows_mouse && exists_div() && !lastMoreText.includes(lookup[0].substring(0, Math.max(0, lookup[0].length-2))))
        else if(response != "itsthesame" && exists_div() && !lastMoreText.includes(lookup[0].substring(0, Math.max(1, lookup[0].length-2))))
            lookup_cancel();
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

function lookup_enqueue(text, x, y, x2, y2, moreText, index)
{
    //console.log("trying to enqueue lookup");
    lookup_queue = [[text, x, y, x2, y2, moreText, index]];
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
    lookup_queue = [];
    if(!settings.sticky || get_doc().body.getElementsByClassName("nazeka_mining_ui").length != 0 || platform == "android")
        delete_div();
}

function manual_close()
{
    lookup_queue = [];
    delete_div();
    last_manual_interaction = Date.now();
}

function lookup_cancel_force()
{
    lookup_queue = [];
    delete_div();
}

let japanesePunctuation = "、。「」｛｝（）【】『』〈〉《》：・／…︙‥︰＋＝－÷？！．～―";
let japaneseSeparators = "。？！";

function lookup_left()
{
    if(!exists_div()) return;
    let text = last_lookup[5];
    let index = last_lookup[6];
    if (index <= 0) return;
    index--;
    while (index > 0 && (text.codePointAt(index) < 0x100 || japanesePunctuation.includes(text.charAt(index))))
        index--;
    text = text.substring(index);
    
    lookup_queue = [[text, last_lookup[1], last_lookup[2], last_lookup[3], last_lookup[4], last_lookup[5], index]];
    last_manual_interaction = Date.now();
}

function lookup_right()
{
    if(!exists_div()) return;
    let text = last_lookup[5];
    let index = last_lookup[6];
    if (index >= text.length-1) return;
    index++;
    while (index < text.length-1 && (text.codePointAt(index) < 0x100 || japanesePunctuation.includes(text.charAt(index))))
        index++;
    text = text.substring(index);
    
    lookup_queue = [[text, last_lookup[1], last_lookup[2], last_lookup[3], last_lookup[4], last_lookup[5], index]];
    last_manual_interaction = Date.now();
}

let time_of_last = Date.now();

let search_x_offset = -3;
function isInline()
{
	return display == "inline" || display == "ruby" || display == "ruby-base";
}
function grab_more_text(textNode, direction = 1)
{
    if(direction > 0)
        direction = 1;
    else
        direction = -1;
    let text = "";
    let current_node = textNode;
    let iters = 0;
    while(text.length < settings.contextlength
        && !text.includes("。") && !text.includes("！") && !text.includes("‼") && !text.includes("？")　&& !text.includes("??") && !text.includes("…")
        && (!text.includes("\n") || settings.ignore_linebreaks))
    {
        iters += 1;
        if(current_node == undefined) break;
        // don't search up parent element if current element isn't inline-like
        try
        {
            let display = getComputedStyle(current_node).display;
            // break out of elements neither inline nor ruby
				//console.log(display);
            if(!isInline() && current_node.tagName.toLowerCase() != "span")
            {
                break;
            }
        }catch(err){}
        
        if(iters > 100)
        {
            console.log("too many iterations");
            console.log(current_node);
            break;
        }
        
        let parent = current_node.parentNode;
        if(parent == undefined || parent == current_node) break;
        let i = Array.prototype.indexOf.call(current_node.parentNode.childNodes, current_node);
        if(i < 0) break;
        i += direction;
        while(i < current_node.parentNode.childNodes.length && i >= 0 && text.length < settings.contextlength && (!text.includes("\n") || settings.ignore_linebreaks))
        {
            let next_node = current_node.parentNode.childNodes[i];
            i += direction;
            let tagname = next_node.tagName ? next_node.tagName.toLowerCase() : "";
            
            if(tagname == "br" && !settings.ignore_linebreaks)
                break;
            if(tagname == "rt" || tagname == "rp")
                continue;
            // next_node might not be an Element
            try
            {
                let ttext = "";
                
                let display = getComputedStyle(next_node).display;
                if(display == "ruby-text")
                    continue;
                
                if(isInline() || (next_node.tagName?next_node.tagName.toLowerCase() == "span":false))
                {
                    if(direction > 0)
                        ttext += next_node.textContent;
                    else
                        ttext = next_node.textContent + ttext;
                }
                // BUG: this should technically be recursive, not a special case, but it won't affect any real webpages
                if(display == "ruby")
                {
                    let subtext = "";
                    for(let child of next_node.childNodes)
                    {
                        try
                        {
                            let display = getComputedStyle(child).display;
                            //if(display == "ruby-text")
                            //    continue;
                            if(isInline() || (child.tagName?child.tagName.toLowerCase() == "span":false))
                            {
                                subtext += child.textContent;
                            }
                        }
                        catch(err)
                        {
                            subtext += child.textContent;
                        }
                    }
                    if(direction > 0)
                        ttext += subtext;
                    else
                        ttext = subtext + ttext;
                }
                if(direction > 0)
                    text += ttext;
                else
                    text = ttext + text;
            }
            catch(err)
            {
                if(direction > 0)
                    text += next_node.textContent;
                else
                    text = next_node.textContent + text;
            }
        }
        if(text.length < settings.contextlength)
            current_node = current_node.parentNode;
        else
            break;
    }
    return text;
}


function grab_text(textNode, offset, elemental)
{
    //console.log("found text");
    let text = "";
    let moreText = "";
    if(elemental)
    {
        moreText = textNode.value;
        text = moreText.substring(offset, textNode.value.length);
    }
    else
    {
        moreText = textNode.textContent;
        text = moreText.substring(offset, textNode.textContent.length);
    }
    
    text += grab_more_text(textNode);
    moreText = grab_more_text(textNode, -1) + moreText + grab_more_text(textNode);
    text = text.replace(/\((?:.)*?\)/gm, '');
    moreText = moreText.replace(/\((?:.)*?\)/gm, '');
    //console.log(moreText);
    if(settings.ignore_linebreaks)
        text = text.replace(/\n/g, "");
    if(settings.ignore_linebreaks)
        moreText = moreText.replace(/\n/g, "");
    
    //console.log("more (orig): " + moreText);
    //console.log("less (orig): " + text);
    
    let index = moreText.lastIndexOf(text);
    
    let leftwards = 0;
    let rightwards = 0;
    
    while(!japaneseSeparators.includes(moreText[index + leftwards]) && moreText[index + leftwards] != "\n" && index + leftwards >= 0)
        leftwards--;
    leftwards++;
    
    while(!japaneseSeparators.includes(moreText[index + rightwards]) && moreText[index + rightwards] != "\n" && index + rightwards < moreText.length)
        rightwards++;
    
    moreText = moreText.substring(index+leftwards, index+rightwards);
    text = text.substring(0, rightwards);
    
    index = -leftwards;
    
    //console.log("more: " + moreText);
    //console.log("less: " + text);
    
    // grab text from later and surrounding DOM nodes
    text = moreText.substring(index);
    return [text, moreText, index];
}

let last_seen_event = undefined;
let shift_down = false;
let ctrl_down = false;
function update(event)
{
    if(!event) return;
    last_seen_event = event;
    
    if((settings.popup_requires_key == 2 && !shift_down)
    || (settings.popup_requires_key == 1 && !ctrl_down))
    {
        function sqr(n) {return n*n;}
        if(Math.sqrt(sqr(last_display_x-event.pageX) + sqr(last_display_y-event.pageY)) > 20)
            lookup_cancel();
        return;
    }
    
    if(!settings.enabled) return;
    
    if(settings.popup_follows_mouse && exists_div() && platform != "android" && (!settings.sticky || get_doc().body.getElementsByClassName("nazeka_mining_ui").length != 0))
    {
        let other = get_div();
        //let middle = other.firstChild.cloneNode(true);
        let middle = other.firstChild;
        if(middle)
            display_div(middle, event.pageX, event.pageY);
        //move_div(event.pageX, event.pageY);
    }
    
    if(Date.now() - time_of_last < settings.lookuprate)
    {
        return;
    }
    
    if(platform == "android" && Date.now() - last_manual_interaction < 150)
        return;
    
    //console.log("---- entry to word lookup at " + Date.now());
    time_of_last = Date.now();
    //console.log("searching for text");
    let textNode;
    let offset;
    let hitrect;
    
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
        
        let hitpage = function(x, searchoffset, y)
        {
            let xoffset = 0;
            let yoffset = 0;
            let ele = document.elementFromPoint(x, y);
            if(ele && window.getComputedStyle(ele).writingMode.includes("vertical"))
                yoffset = searchoffset;
            else
                xoffset = searchoffset;
            if (document.caretPositionFromPoint)
            {
                let caretdata = document.caretPositionFromPoint(x+xoffset, y+yoffset);
                if(caretdata)
                {
                    textNode = caretdata.offsetNode;
                    offset = caretdata.offset;
                    
                    let range = document.createRange();
                    range.selectNode(textNode);
                    hitrect = range.getBoundingClientRect();
                    range.detach();
                }
            }
            else if (document.caretRangeFromPoint)
            {
                let range = document.caretRangeFromPoint(x+xoffset, y+yoffset);
                if(range)
                {
                    textNode = range.startContainer;
                    offset = range.startOffset;
                    hitrect = range.getBoundingClientRect();
                }
            }
            if(ele && !ele.contains(textNode) && platform != "android" && (!settings.sticky || get_doc().body.getElementsByClassName("nazeka_mining_ui").length != 0)) // sticky mode and android need to break out on parent detection
            {
                textNode = undefined;
                offset = undefined;
                hitrect = undefined;
            }
            if(hitrect && (x > hitrect.right+5 || x < hitrect.left-5 || y > hitrect.bottom+5 || y < hitrect.top-5))
            {
                textNode = undefined;
                offset = undefined;
                hitrect = undefined;
            }
        };
        
        hitpage(event.clientX, search_x_offset, event.clientY);
        // try without the offset
        if (textNode == undefined || (textNode.nodeType != 3 && !acceptable_element(textNode)))
            hitpage(event.clientX, 0, event.clientY);
        
        if ((platform == "android" || (settings.sticky && get_doc().body.getElementsByClassName("nazeka_mining_ui").length == 0)) && exists_div())
        {
            let ele = get_div();
            if(ele.contains(textNode))
                return;
        }
        
        if(!(textNode == undefined))
        {
            // we hit an node, see if it's a transparent element and try to move it under everything temporarily if it is
            try
            {
                if(textNode.nodeType == 1 && !nodeResetSeen.has(textNode) && !acceptable_element(textNode))
                {
                    let style = getComputedStyle(textNode)
                    let bg_color = style.getPropertyValue("background-color"); 
                    if(bg_color == "rgba(0, 0, 0, 0)")
                    {
                        nodeIsBad = true;
                        nodeResetList.unshift([textNode, style.getPropertyValue("z-index")]);
                        nodeResetSeen.add(textNode);
                        textNode.style.zIndex = "-1000000000000000000000";
                        continue;
                    }
                }
            }
            catch(err)
            {
                console.log(err);
            }
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
        //let hit = (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom);
        if(!hit)
        {
            lookup_cancel();
            return;
        }
        
        let found = grab_text(textNode, offset, elemental);
        let text = found[0];
        let moreText = found[1];
        let index = found[2];
        
        //text = text.trim();
        
        //print_object(text);
        text = text.substring(0, Math.min(text.length, settings.length));
        
        //if(text != "")
            //lookup_indirect(text, event.clientX, event.clientY, time_of_last);
        if(text != "")
        {
            //console.log("calling lookup_enqueue");
            lookup_enqueue(text, event.clientX, event.clientY, event.pageX, event.pageY, moreText, index);
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
    mydiv.style = "background-color: rgba(0, 0, 0, 0.5); color: white; width: 200px; position: fixed; right: 25px; bottom: 25px; z-index: 1000000000000000000000; padding: 5px; border-radius: 3px;"
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
    //console.log(cards);
    cards.push(object);
    browser.storage.local.set({cards:cards});
}

async function try_to_play_audio(object)
{
    if(!exists_div())
        return;
    let mydiv = get_div().querySelector(".nazeka_audioref");
    if(mydiv)
    {
        let text = mydiv.innerText;
        let url;
        if(text.includes(";"))
        {
            let fields = text.split(";");
            url = "https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kana=" + fields[0] + "&kanji=" + fields[1];
        }
        else
            url = "https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kana=" + text + "&kanji=" + text;
        let audio = new Audio(url);
        audio.volume = settings.volume;
        audio.play();
    }
}

function mine(highlight)
{
    // TODO mine audio information
    
    let front = highlight.textContent;
    let word = highlight.parentElement.parentElement;
    let readings = "";
    let readings_elements = word.getElementsByClassName("nazeka_readings");
    if(readings_elements.length)
        readings = readings_elements[0].textContent;
    let definitions = word.getElementsByClassName("nazeka_definitions")[0].innerText; // innerText retains newlines, which we actually want
    let lookup = word.parentElement.querySelector(".nazeka_lookup");
    let sentence = word.parentElement.querySelector(".nazeka_lookup_sentence");
    let index = word.parentElement.querySelector(".nazeka_lookup_index");
    let seq = word.getAttribute("nazeka_seq");
    
    mine_to_storage({front: front, readings: readings, definitions: definitions, lookup: lookup.textContent, sentence: sentence.textContent, index: index.textContent, seq: seq});
}

function keytest(event)
{
    if(event.target != document.body)
        return;
    if(settings.popup_requires_key == 2 && event.key == "Shift")
    {
        shift_down = true;
        update(last_seen_event);
        return;
    }
    if(settings.popup_requires_key == 1 && event.key == "Control")
    {
        ctrl_down = true;
        update(last_seen_event);
        return;
    }
    if(event.shiftKey || event.ctrlKey || event.metaKey || event.altKey)
        return;
    if(event.key == settings.hotkey_mine)
    {
        if(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
        {
            while(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
            {
                console.log("deleting");
                get_doc().body.getElementsByClassName("nazeka_mining_ui")[0].remove();
            }
            console.log("deleted");
        }
        else
        {
            if(!exists_div())
                return;
            while(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
                get_doc().body.getElementsByClassName("nazeka_mining_ui")[0].remove();
            //console.log("mining request");
            let mydiv = get_div().cloneNode(true);
            delete_div();
            set_sticky_styles(mydiv);
            mydiv.className = "nazeka_mining_ui";
            let newheader = document.createElement("div");
            newheader.textContent = "Mining UI. Press the given entry's main spelling to mine it, or click this message to cancel.";
            newheader.addEventListener("click", ()=>
            {
                while(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
                    get_doc().body.getElementsByClassName("nazeka_mining_ui")[0].remove();
            });
            mydiv.firstChild.firstChild.prepend(newheader);
            mydiv.style.zIndex = 1000000000000000000000;
            // do not compound! z-index can be range limited by the browser
            mydiv.style.zIndex -= 1;
            
            for(let keb of mydiv.getElementsByClassName("nazeka_main_keb"))
            {
                keb.addEventListener("click", (event)=>
                {
                    mine(event.target);
                    while(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
                        get_doc().body.getElementsByClassName("nazeka_mining_ui")[0].remove();
                });
            }
            for(let reb of mydiv.getElementsByClassName("nazeka_main_reb"))
            {
                reb.addEventListener("click", (event)=>
                {
                    mine(event.target);
                    while(get_doc().body.getElementsByClassName("nazeka_mining_ui").length)
                        get_doc().body.getElementsByClassName("nazeka_mining_ui")[0].remove();
                });
            }
            
            get_doc().body.appendChild(mydiv);
        }
    }
    if(!exists_div())
        return;
    if(event.key == settings.hotkey_close)
    {
        lookup_cancel_force();
    }
    if(event.key == settings.hotkey_sticky)
    {
        settings.sticky = !settings.sticky;
        browser.storage.local.set({"sticky":settings.sticky});
    }
    if(event.key == settings.hotkey_audio)
    {
        try_to_play_audio();
    }
    if(event.key == settings.hotkey_nudge_left)
    {
        lookup_left();
    }
    if(event.key == settings.hotkey_nudge_right)
    {
        lookup_right();
    }
}

function keyuntest(event)
{
    if(event.key == "Shift")
        shift_down = false;
    if(event.key == "Control")
        ctrl_down = false;
    
}

window.addEventListener("mousemove", update);
window.addEventListener("keydown", keytest);
window.addEventListener("keyup", keyuntest);
document.addEventListener("touchstart", update_touch);

