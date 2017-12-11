// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

/*
 * TODO:
 * 
 * ! Port all of Spark Reader's deconjugation rules https://github.com/wareya/Spark-Reader/blob/master/preferences/underlay https://github.com/wareya/Spark-Reader/tree/master/src/language/deconjugator
 * ! Different CSS for different parts of definitions
 * - Fix katakana-hiragana matching (only happens in lookups right now, not display generation)
 * - Definition priority handling (prefer words with any commonness tags, shorter deconjugations, expressions, non-archaic/non-obscure words, high frequencies)
 * - More configurability
 * - VNstats frequency data
 * - Load deconjugation rules from an advanced setting, with a reset button
 * - Work with text input fields
 * ? List definitions of shorter text strings if they're not pure kana (in addition to main definitions)
 * 
 */

// ~~~~ interesting stuff happens a few hundred lines down at stdrule_deconjugate(), get past the DOM-writing-related stuff ~~~~

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

function build_div (text, result)
{
    //console.log("Displaying:");
    //print_object(result);
    let middle = document.createElement("div");
    let temp = document.createElement("div");
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
                temptag += kanji_text;
                
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
            temptag += text;
            if(term.deconj)
            {
                for(let form of term.deconj)
                {
                    if(form.process.length > 0)
                        temptag += "～";
                    for(let f = 0; f < form.process.length; f++)
                    {
                        let info = form.process[f];
                        temptag += info;
                        if(f+1 < form.process.length)
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

// deconjugation rules
let rules = [];

// TODO: load rules from an underlay

// core verb stems for typical verb types

rules.push({type: "onlyfinalrule", dec_end:"る", con_end:"た", dec_tag:"v1", con_tag:"stem_past", detail:"past"});
rules.push({type: "onlyfinalrule", dec_end:"る", con_end:"て", dec_tag:"v1", con_tag:"stem_te", detail:"te form"});
rules.push({type: "stdrule", dec_end:"る", con_end:"ない", dec_tag:"v1", con_tag:"negative", detail:"negative"});
rules.push({type: "stdrule", dec_end:"る", con_end:"らない", dec_tag:"v5r", con_tag:"negative", detail:"negative"});
rules.push({type: "rewriterule", dec_end:"です", con_end:"でした", dec_tag:"exp", con_tag:"stem_past", detail:"past"});
rules.push({type: "stdrule", dec_end:"る", con_end:"っ", dec_tag:"v5r", con_tag:"stem_ren_less", detail:"(unstressed infinitive)"});
rules.push({type: "stdrule", dec_end:"", con_end:"た", dec_tag:"stem_ren_less", con_tag:"stem_past", detail:"past"});

rules.push({type: "stdrule"
, dec_end:
["く","す","つ","う","る","ぐ","ぶ","ぬ","む","る","う","く"]
, con_end:
["け","せ","て","え","れ","げ","べ","ね","め","れ","え","け"]
, dec_tag:
["v5k","v5s","v5t","v5u","v5r","v5g","v5b","v5n","v5m","v1","v5u_s","v5k_s"]
, con_tag:"stem_e", detail:"(izenkei)"});

rules.push({type: "stdrule", dec_end:"", con_end:"る", dec_tag:"stem_e", con_tag:"v1", detail:"potential"});

rules.push({type: "stdrule", dec_end:"", con_end:"すぎる", dec_tag:"stem_ren", con_tag:"v1", detail:"too much"});
rules.push({type: "stdrule", dec_end:"", con_end:"ください", dec_tag:"stem_te", con_tag:"adj_i", detail:"polite request"});

// return deconjugated form if stdrule applies to form, return otherwise
function stdrule_deconjugate_inner(my_form, my_rule)
{
    // can't deconjugate nothingness
    if(my_form.text == "")
        return;
    // ending doesn't match
    if(!my_form.text.endsWith(my_rule.con_end))
        return;
    // deconjugated form too much longer than conjugated form
    if(my_form.text.length > my_form.original_text.length+10)
        return;
    // impossibly information-dense
    if(my_form.tags.length > my_form.original_text.length+6)
        return;
    // tag doesn't match
    if(my_form.tags.length > 0 && my_form.tags[my_form.tags.length-1] != my_rule.con_tag)
    {
        if(false)//my_rule.detail=="potential")
        {
            console.log("Returning from deconjugation: tag doesn't match");
            console.log(my_form);
            console.log(my_rule);
        }
        return;
    }
    
    let newtext = my_form.text.substring(0, my_form.text.length-my_rule.con_end.length)+my_rule.dec_end;
    
    // I hate javascript reeeeeeeeeeeeeee
    let newform = {};//new Object();
    newform.text = newtext;
    newform.original_text = my_form.original_text;
    newform.tags = my_form.tags.slice();
    newform.seentext = new Set([...my_form.seentext]);
    newform.process = my_form.process.slice();
    
    newform.text = newtext;
    
    newform.process.push(my_rule.detail);
    
    if(newform.tags.length == 0)
        newform.tags.push(my_rule.con_tag);
    newform.tags.push(my_rule.dec_tag);
    
    if(newform.seentext.size == 0)
        newform.seentext.add(my_form.text);
    newform.seentext.add(newtext);
    
    return newform;
};
function stdrule_deconjugate(my_form, my_rule)
{
    let array = undefined;
    // pick the first one that is an array
    // FIXME: use minimum length for safety reasons? assert all arrays equal length?
    if(Array.isArray(my_rule.dec_end))
        array = my_rule.dec_end;
    else if(Array.isArray(my_rule.con_end))
        array = my_rule.con_end;
    else if(Array.isArray(my_rule.dec_tag))
        array = my_rule.dec_tag;
    else if(Array.isArray(my_rule.con_tag))
        array = my_rule.con_tag;
    
    if(array == undefined)
        return stdrule_deconjugate_inner(my_form, my_rule);
    else
    {
        let collection = new Set();
        for(let i = 0; i < array.length; i++)
        {
            let virtual_rule = {};
            virtual_rule.type = my_rule.type;
            
            let index_or_value = function (variable, index)
            {
                if(Array.isArray(variable))
                    return variable[index];
                else
                    return variable;
            }
            
            virtual_rule.dec_end = index_or_value(my_rule.dec_end, i);
            virtual_rule.con_end = index_or_value(my_rule.con_end, i);
            virtual_rule.dec_tag = index_or_value(my_rule.dec_tag, i);
            virtual_rule.con_tag = index_or_value(my_rule.con_tag, i);
            virtual_rule.detail = my_rule.detail;
            
            let ret = stdrule_deconjugate_inner(my_form, virtual_rule);
            if(ret) collection.add(ret);
        }
        return collection;
    }
};
function rewriterule_deconjugate(my_form, my_rule)
{
    if(my_form.text != my_rule.con_end)
        return;
    return stdrule_deconjugate(my_form, my_rule);
};
function onlyfinalrule_deconjugate(my_form, my_rule)
{
    if(my_form.tags.length != 0)
        return;
    return stdrule_deconjugate(my_form, my_rule);
};
function neverfinalrule_deconjugate(my_form, my_rule)
{
    if(my_form.tags.length == 0)
        return;
    return stdrule_deconjugate(my_form, my_rule);
};

let rule_functions = {
stdrule: stdrule_deconjugate,
rewriterule: rewriterule_deconjugate,
onlyfinalrule: onlyfinalrule_deconjugate,
neverfinalrule: neverfinalrule_deconjugate,
};

Set.prototype.union = function(setB)
{
    let union = new Set(this);
    for (let elem of setB)
        union.add(elem);
    return union;
}

// Returns a set of objects, each containing the "final form" of a series of deconjugations
// The majority of these objects will fail being compared to the dictionary forms
// The algorithm is a right-edge rule checker that finds all applicable series of rules.
// TODO: add all underlay rule types
function deconjugate(mytext)
{
    let processed = new Set();
    let novel = new Set();
    
    let start_form = {text: mytext, original_text: mytext, tags: [], seentext: new Set(), process: [] };
    novel.add(start_form);
    
    while(novel.size > 0)
    {
        //print_object(novel);
        let new_novel = new Set();
        for(let form of novel)
        {
            for(let i = 0; i < rules.length; i++)
            {
                let rule = rules[i];
                
                let newform = rule_functions[rule.type](form, rule);
                
                if(newform != undefined && newform.constructor === Set)
                {
                    for(let myform of newform)
                    {
                        if(myform != undefined && !processed.has(myform) && !novel.has(myform) && !new_novel.has(myform))
                            new_novel.add(myform);
                    }
                }
                else if(newform != undefined && !processed.has(newform) && !novel.has(newform) && !new_novel.has(newform))
                    new_novel.add(newform);
            }
        }
        processed = processed.union(novel);
        novel = new_novel;
    }
    
    return processed;
}

// ask background thread for a list of definitions
async function lookup_word(text)
{
    return browser.runtime.sendMessage({type: "search", text: text});
}

// takes deconjugated forms and looks them up in a dictionary
// building a list of all matches
async function build_lookup_comb (forms)
{
    // FIXME: dumpster fire that shouldn't be anywhere near as complicated as I made it
    
    // This is the only part of this function that doesn't look like a garbage fire.
    // Looks for dictionary definitions of each deconjugated form.
    let looked_up = {};
    for(let form of forms)
    {
        if(!looked_up.hasOwnProperty(form.text))
        {
            let result = await lookup_word(form.text);
            if(result)
            {
                for(let r = 0; r < result.length; r++)
                {
                    let entry = result[r];
                    entry.deconj = undefined; // clear if something set it before, we need this later
                    // store all the parts of speech that this dictionary entry can apply to
                    // normally, they're scattered across its senses
                    // FIXME: care about senses with restricted spellings when building part-of-speech tags list
                    entry.allpos = new Set();
                    for(let i = 0; i < entry.sense.length; i++)
                    {
                        let sense = entry.sense[i];
                        for(let j = 0; j < sense.pos.length; j++)
                            entry.allpos.add(sense.pos[j]);
                    }
                }
                looked_up[form.text] = result;
            }
        }
    }
    // FIXME: This is garbage.
    // Add deconjugation field to all those entries
    for(let form of forms)
    {
        if(looked_up.hasOwnProperty(form.text))
        {
            let result = looked_up[form.text];
            for(let entry of result)
            {
                // If the form requires definition to have a particular POS tag, check for it
                if(form.tags.length > 0)
                {
                    if(entry.allpos.has(form.tags[form.tags.length-1]))
                    {
                        if(entry.deconj)
                            entry.deconj.add(form);
                        else
                            entry.deconj = new Set([form]);
                    }
                }
                else
                {
                    if(entry.deconj)
                        entry.deconj.add(form);
                    else
                        entry.deconj = new Set([form]);
                }
            }
        }
    }
    // FIXME: This should merge based on map from JMdict entity ID to entry.
    // FIXME: Because it's theoretically possible to get the same definition from different spellings from different deconjugations of the same string.
    // Make a list of each definition that has an associated deconjugation (even if it's a zero-depth deconjugation)
    let merger = [];
    for(let result of Object.values(looked_up))
    {
        for(let entry of result)
        {
            //console.log("testing A");
            //print_object(entry);
            if(entry.deconj)
                merger.push(entry);
        }
    }
    //print_object(merger);
    if(merger.length > 0)
        return merger;
    else
        return;
}

let last_lookup = "";
let last_time_lookup = Date.now();

// FIXME: Use a queue of lookups to look for or something. This is really crappy.
// FIXME: Because we want to skip every lookup except the most recent one, and never run lookups more than once at the same "time".
async function lookup_indirect (text, x, y, x2, y2, time)
{
    if(text == "")
        return;
    //if(time < last_time_lookup+20) // reduces lag buildup
    //    return;
    if(text == last_lookup && (exists_div()))// || time < last_time_lookup+100)) // helps reduce double-lookups
        return;
    last_lookup = text;
    last_time_lookup = time;
    
    // try to look up successively shorter substrings of text
    // deconjugate() returns possible deconjugations, one of which has zero deconjugations, i.e. the plain text
    // build_lookup_comb looks for dictionary definitions matching any deconjugation, returning a list of them
    let forms = deconjugate(text);
    let result = await build_lookup_comb(forms);
    while(result === undefined && text.length > 0)
    {
        //console.log("trying to look up " + text);
        text = text.substring(0, text.length-1);
        forms = deconjugate(text);
        result = await build_lookup_comb(forms);
    }
    if(result !== undefined)
    {
        //console.log("found lookup");
        //console.log(text)
        let mydiv = build_div(text, result);
        if(mydiv)
            display_div(mydiv, x2, y2);
    }
    else
    {
        //console.log("did not find lookup");
        //console.log(text);
    }
}


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
        await lookup_indirect(lookup[0], lookup[1], lookup[2], lookup[3], lookup[4], Date.now());
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


