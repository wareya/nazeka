// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

// updated by a timer looping function, based on local storage set by the options page
// we only use a tiny number of settings here

let settings = {
reader_width: 800,
reader_height: 300,
deconjugator_rules_json: "",
};

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
        getvar("reader_width", 800);
        getvar("reader_height", 300);
        getvar("deconjugator_rules_json", "");
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
});

// We use JMdict converted to JSON. It's like 32MB so we don't want to load it for every tab.
// So we need to use a background script and send messages to it from the content script.
// Unfortunately webextensions don't have an easy way to load files, even from in the extension.
// We have to send an HTTP request and store the result in a string before parsing it into an object.
// Seriously.

let json_dicts = [];

function add_json_reading(dict, text, id)
{
    if(text === "")
        return;
    if (!dict.lookup_json_kana.has(text))
        dict.lookup_json_kana.set(text, [id]);
    else
        dict.lookup_json_kana.get(text).push(id);
}
function add_json_spelling(dict, text, id)
{
    if(text === "")
        return;
    if (!dict.lookup_json_kan.has(text))
        dict.lookup_json_kan.set(text, [id]);
    else
        dict.lookup_json_kan.get(text).push(id);
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

async function refresh_json()
{
    let custom_dicts = (await get_storage_or_default("custom_dicts", []));
    json_dicts = [];
    for(let stored_dict of custom_dicts)
    {
        if(!stored_dict.enabled)
            continue;
        let name = stored_dict.name;
        let entries = JSON.parse(stored_dict.entries);
        let lookup_json_kan = new Map();
        let lookup_json_kana = new Map();
        let dict = {"name": name, "entries": entries, "lookup_json_kan": lookup_json_kan, "lookup_json_kana": lookup_json_kana};
        try
        {
            for (let i = 0; i < entries.length; i++)
            {
                add_json_reading(dict, entries[i]["r"], i);
                for(let spelling of entries[i]["s"])
                    add_json_spelling(dict, spelling, i);
            }
        } catch(e){}
        json_dicts.push(dict);
    }
}

async function migrate_legacy_then_refresh()
{
    let myjson = (await browser.storage.local.get(["epwing"]))["epwing"];
    if(myjson !== undefined)
    {
        let epwing = JSON.parse(myjson);
        let name = epwing.shift();
        
        let custom_dicts = (await get_storage_or_default("custom_dicts", []));
        custom_dicts.push({"name": name, "entries": JSON.stringify(epwing), "enabled": true});
        
        browser.storage.local.set({"custom_dicts":custom_dicts});
        
        browser.storage.local.remove(["epwing"]);
    }
    
    refresh_json();
}

migrate_legacy_then_refresh();


let dict = [];
let lookup_kan = new Map();
let lookup_kana = new Map();

let dictsloaded = 0;

function builddict()
{
    if (this.readyState === 4)
    {
        if (this.status === 200)
        {
            dict = dict.concat(JSON.parse(this.responseText));
            dictsloaded++;
        }
        else
            console.error(xhr.statusText);
    }
}

let lookup_audio = new Set();
let lookup_audio_broken = new Map();

function build_audio_table()
{
    if (this.readyState === 4)
    {
        if (this.status === 200)
        {
            let i = 0;
            let j = 0;
            while ((j = this.responseText.indexOf("\n", i)) !== -1)
            {
                let text = this.responseText.substring(i, j);
                if(!text.includes(","))
                    lookup_audio.add(text);
                else
                    lookup_audio_broken.set(text.split(",")[1], text.split(",")[0]);
                i = j + 1;
            }
            let text = this.responseText.substring(i, j);
            if(!text.includes(","))
                lookup_audio.add(text);
            else
                lookup_audio_broken.set(text.split(",")[1], text.split(",")[0]);
        }
        else
            console.error(xhr.statusText);
    }
}

let kanji_data = new Map();

function load_kanji()
{
    if (this.readyState === 4)
    {
        if (this.status === 200)
        {
            let data = JSON.parse(this.responseText);
            for(let entry of data)
                kanji_data.set(entry["c"], entry);
        }
        else
            console.error(xhr.statusText);
    }
}

// Having a >4MB flat text file with stupid adhoc formatting is okay
// but having a >4MB json file with nothing weird in it isn't
// Thanks, linter team!
function load_part_of_dictionary(filename)
{
    let req = new XMLHttpRequest();
    req.addEventListener("load", builddict);
    req.open("GET", browser.extension.getURL(filename));
    req.send();
    return req;
}

function load_jdic_audio_table(filename)
{
    let req = new XMLHttpRequest();
    req.addEventListener("load", build_audio_table);
    req.open("GET", browser.extension.getURL(filename));
    req.send();
    return req;
}


function load_kanji_data(filename)
{
    let req = new XMLHttpRequest();
    req.addEventListener("load", load_kanji);
    req.open("GET", browser.extension.getURL(filename));
    req.send();
    return req;
}

load_part_of_dictionary("dict/JMdict1.json");
load_part_of_dictionary("dict/JMdict2.json");
load_part_of_dictionary("dict/JMdict3.json");
load_part_of_dictionary("dict/JMdict4.json");
load_part_of_dictionary("dict/JMdict5.json");
load_part_of_dictionary("dict/JMdict6.json");
load_part_of_dictionary("dict/JMdict7.json");
load_part_of_dictionary("dict/JMdict8.json");
load_part_of_dictionary("dict/JMdict9.json");
load_part_of_dictionary("dict/JMdict10.json");
load_part_of_dictionary("dict/JMdict11.json");

load_jdic_audio_table("dict/jdic audio.txt");

load_kanji_data("dict/kanjidata.json");

function buildlookups()
{
    // Build map of spellings to dictionary entry.

    for (let i = 0; i < dict.length; i++)
    {
        let entry = dict[i];
        if (entry.k_ele != undefined) for (let j = 0; j < entry.k_ele.length; j++)
        {
            let s = entry.k_ele[j];
            if (!lookup_kan.has(s.keb))
                lookup_kan.set(s.keb, [i]);
            else
                lookup_kan.get(s.keb).push(i);
        }
        for (let j = 0; j < entry.r_ele.length; j++)
        {
            let s = entry.r_ele[j];
            if (!lookup_kana.has(s.reb))
                lookup_kana.set(s.reb, [i]);
            else
                lookup_kana.get(s.reb).push(i);
        }
    }
    for (let i = 0; i < 5; i++)
    {
        console.log(dict[i]);
    }
    console.log("built lookup tables");
    console.log("size:");
    console.log(lookup_kan.size);
    console.log(lookup_kana.size);
    console.log("dict size:");
    console.log(dict.length);
}

let waiter = undefined;
function waittobuildlookups()
{
    if(dictsloaded == 11)
    {
        clearInterval(waiter);
        waiter = undefined;
        buildlookups();
    }
}
waiter = setInterval(waittobuildlookups, 1000);

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

function getfromdict(indexes, text)
{
    let ret = [];
    for(let i = 0; i < indexes.length; i++)
    {
        let entry = {};
        Object.assign(entry, dict[indexes[i]]);
        
        entry.from = text;
        if(entry.k_ele)
        {
            for(let spelling of entry.k_ele)
            {
                if(spelling.keb == entry.from)
                {
                    entry.found = spelling;
                    break;
                }
            }
        }
        if(!entry.found && entry.r_ele)
        {
            for(let spelling of entry.r_ele)
            {
                if(spelling.reb == entry.from)
                {
                    entry.found = spelling;
                    break;
                }
            }
        }
        
        let lastpos = [];
        // JMdict tags part-of-speech for senses sparsely
        // e.g. if 1. and 2. share the same list of POSs, only 1. will have a POS list
        // undoing this here makes things in the content script WAY less inconvenient
        for(let j = 0; j < entry.sense.length; j++)
        {
            if(entry.sense[j].pos)
            {
                for(let t = 0; t < entry.sense[j].pos.length; t++)
                {
                    if(entry.sense[j].pos[t].charAt(0)=="&")
                        entry.sense[j].pos[t] = clip(entry.sense[j].pos[t]);
                }
            }
            else
                entry.sense[j].pos = lastpos;
            lastpos = entry.sense[j].pos;
        }
        ret.push(entry);
    }
    return ret;
}

function replace_hira_with_kata(text)
{
    let newtext = "";
    for(let i = 0; i < text.length; i++)
    {
        let codepoint = text.codePointAt(i);
        if(codepoint >= 0x3040 && codepoint <= 0x309F)
            codepoint += (0x30A0 - 0x3040);
        newtext += String.fromCodePoint(codepoint);
    }
    return newtext;
}

function replace_kata_with_hira(text)
{
    let newtext = "";
    for(let i = 0; i < text.length; i++)
    {
        let codepoint = text.codePointAt(i);
        if(codepoint >= 0x30A0 && codepoint <= 0x30FF)
            codepoint -= (0x30A0 - 0x3040);
        newtext += String.fromCodePoint(codepoint);
    }
    return newtext;
}

function search_inner(text)
{
    if (lookup_kan.has(text))
        return getfromdict(lookup_kan.get(text), text);
    else if (lookup_kana.has(text))
        return getfromdict(lookup_kana.get(text), text);
    else
        return;
}

function search(text)
{
    let ret = undefined;
    ret = search_inner(text);
    if(ret) return ret;
    ret = search_inner(replace_hira_with_kata(text));
    if(ret) return ret;
    ret = search_inner(replace_kata_with_hira(text));
    if(ret) return ret;
}

// deconjugation rules
let rules = [];

function load_deconjugation_rules(filename)
{
    let req = new XMLHttpRequest();
    req.addEventListener("load", () =>
    {
        if (req.readyState === 4)
        {
            console.log("loaded deconjugation rules");
            if (req.status === 200)
                rules = JSON.parse(req.responseText);
            else
                console.error(req.statusText);
        }
    });
    req.open("GET", browser.extension.getURL(filename));
    req.send();
    return req;
}

load_deconjugation_rules("dict/deconjugator.json");

// return deconjugated form if stdrule applies to form, return otherwise
function stdrule_deconjugate_inner(my_form, my_rule)
{
    // ending doesn't match
    if(!my_form.text.endsWith(my_rule.con_end))
        return;
    // tag doesn't match
    if(my_form.tags.length > 0 && my_form.tags[my_form.tags.length-1] != my_rule.con_tag)
        return;
    
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
    // can't deconjugate nothingness
    if(my_form.text == "")
        return;
    // deconjugated form too much longer than conjugated form
    if(my_form.text.length > my_form.original_text.length+10)
        return;
    // impossibly information-dense
    if(my_form.tags.length > my_form.original_text.length+6)
        return;
    // blank detail mean it can't be the last (first applied, but rightmost) rule
    if(my_rule.detail == "" && my_form.tags.length == 0)
        return;
    
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
function contextrule_deconjugate(my_form, my_rule)
{
    if(!context_functions[my_rule.contextrule](my_form, my_rule))
        return;
    return stdrule_deconjugate(my_form, my_rule);
};

function substitution_inner(my_form, my_rule)
{
    if(!my_form.text.includes(my_rule.con_end))
        return;
    let newtext = my_form.text.replace(new RegExp(my_rule.con_end, 'g'), my_rule.dec_end);
    
    // I hate javascript reeeeeeeeeeeeeee
    let newform = {};//new Object();
    newform.text = newtext;
    newform.original_text = my_form.original_text;
    newform.tags = my_form.tags.slice();
    newform.seentext = new Set([...my_form.seentext]);
    newform.process = my_form.process.slice();
    
    newform.text = newtext;
    
    newform.process.push(my_rule.detail);
    
    if(newform.seentext.size == 0)
        newform.seentext.add(my_form.text);
    newform.seentext.add(newtext);
    
    return newform;
};
function substitution_deconjugate(my_form, my_rule)
{
    if(my_form.process.length != 0)
        return;
    
    // can't deconjugate nothingness
    if(my_form.text == "")
        return;
    
    let array = undefined;
    // pick the first one that is an array
    // FIXME: use minimum length for safety reasons? assert all arrays equal length?
    if(Array.isArray(my_rule.dec_end))
        array = my_rule.dec_end;
    else if(Array.isArray(my_rule.con_end))
        array = my_rule.con_end;
    
    if(array == undefined)
        return substitution_inner(my_form, my_rule);
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
            virtual_rule.detail = my_rule.detail;
            
            let ret = substitution_inner(my_form, virtual_rule);
            if(ret) collection.add(ret);
        }
        return collection;
    }
}

let rule_functions = {
stdrule: stdrule_deconjugate,
rewriterule: rewriterule_deconjugate,
onlyfinalrule: onlyfinalrule_deconjugate,
neverfinalrule: neverfinalrule_deconjugate,
contextrule: contextrule_deconjugate,
substitution: substitution_deconjugate
};

function v1inftrap_check(my_form, my_rule)
{
    if(my_form.tags.length != 1) return true;
    let my_tag = my_form.tags[0];
    if(my_tag == "stem-ren")
        return false;
    return true;
};
function saspecial_check(my_form, my_rule)
{
    if(my_form.text == "") return false;
    if(!my_form.text.endsWith(my_rule.con_end)) return false;
    let base_text = my_form.text.substring(0, my_form.text.length-my_rule.con_end.length);
    if(base_text.endsWith("さ"))
        return false;
    return true;
};

let context_functions = {
v1inftrap: v1inftrap_check,
saspecial: saspecial_check,
};

function union(setA, setB)
{
    for (let elem of setB)
        setA.add(elem);
    return setA;
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
    
    let myrules = rules;
    
    try
    {
        if(settings.deconjugator_rules_json != "")
            myrules = JSON.parse(settings.deconjugator_rules_json);
    } catch(err) { console.log(err); }
    
    while(novel.size > 0)
    {
        //print_object(novel);
        let new_novel = new Set();
        for(let form of novel)
        {
            for(let rule of myrules)
            {
                if(!(rule instanceof Object))
                    continue;
                
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
        processed = union(processed, novel);
        novel = new_novel;
    }
    
    return processed;
}

// takes deconjugated forms and looks them up in a dictionary
// building a list of all matches
function build_lookup_comb(forms)
{
    // FIXME: dumpster fire that shouldn't be anywhere near as complicated as I made it
    
    // This is the only part of this function that doesn't look like a garbage fire.
    // Looks for dictionary definitions of each deconjugated form.
    let looked_up = {};
    for(let form of forms)
    {
        if(!looked_up.hasOwnProperty(form.text))
        {
            let result = search(form.text);
            let copied_result = [];
            if(result)
            {
                for(let r = 0; r < result.length; r++)
                {
                    let entry = result[r];
                    //Object.assign(entry, result[r]);
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
                    copied_result.push(entry);
                }
                looked_up[form.text] = copied_result;
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
                        if(entry.deconj === undefined)
                            entry.deconj = new Set();
                        entry.deconj.add(form);
                    }
                }
                else
                {
                    if(entry.deconj === undefined)
                        entry.deconj = new Set();
                    entry.deconj.add(form);
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
            if(entry.deconj)
            {
                entry.deconj = Array.from(entry.deconj);
                merger.push(entry);
            }
        }
    }
    //print_object(merger);
    if(merger.length > 0)
        return merger;
    else
        return;
}

function json_lookup_kanji(dict, spelling_list, readings, inexact)
{
    let indexes_set = new Set();
    let indexes = [];
    for(let spelling of spelling_list)
    {
        let possibilities = dict.lookup_json_kan.get(spelling);
        if(!possibilities)
            continue;
        for(let id of dict.lookup_json_kan.get(spelling))
        {
            if(inexact || readings.includes(dict.entries[id]["r"]))
            {
                if(!indexes_set.has(id))
                {
                    indexes_set.add(id);
                    indexes.push(id);
                }
            }
        }
    }
    return indexes;
}

function json_lookup_kana_exact(dict, kana)
{
    let possibilities = dict.lookup_json_kana.get(dict, kana);
    if(!possibilities)
        return [];
    let actual_possibilities = [];
    for(let index of possibilities)
    {
        let spellings = dict.entries[index]["s"]
        if(spellings.length == 1 && spellings[0] === "")
            actual_possibilities.push(index);
    }
    return actual_possibilities;
}
function json_lookup_kana_inexact(dict, kana)
{
    let possibilities = copy_gen(dict.lookup_json_kana.get(kana));
    if(!possibilities)
        return [];
    return possibilities;
}

function json_lookup_arbitrary_as_is(dict, text)
{
    let index = dict.lookup_json_kan.get(text);
    if(index === undefined)
        index = dict.lookup_json_kana.get(text);
    if(index === undefined)
        return undefined;
    return copy(dict.entries[index]);
}

function add_json_info(lookups, other_settings)
{
    for(let lookup of lookups)
    {
        for(let entry of lookup.result)
        {
            entry.json = [];
            for(let dict of json_dicts)
            {
                // look for an json entry that matches this lookup and jmdict entry
                let json_data = undefined;
                let foundtext = undefined;
                if(entry.orig_found.keb)
                    foundtext = entry.orig_found.keb;
                else
                    foundtext = entry.orig_found.reb;
                
                if(entry.k_ele)
                {
                    let spellings = [lookup.text, foundtext];
                    for(let spelling of entry.k_ele)
                        spellings.push(spelling.keb);
                    let core_readings_a = [lookup.text, foundtext];
                    let core_readings_b = [entry.r_ele[0].reb];
                    let readings = [];
                    for(let reading of entry.r_ele)
                        readings.push(reading.reb);
                    
                    // try exact matches
                    let possibilities = json_lookup_kanji(dict, spellings, core_readings_a, false);
                    if(possibilities.length == 0)
                        possibilities = json_lookup_kanji(dict, spellings, core_readings_b, false);
                    if(possibilities.length == 0)
                        possibilities = json_lookup_kanji(dict, spellings, readings, false);
                    // try inexact matches
                    if(!other_settings.strict_epwing)
                    {
                        if(possibilities.length == 0)
                            possibilities = json_lookup_kanji(dict, spellings, core_readings_a, true);
                        if(possibilities.length == 0)
                            possibilities = json_lookup_kanji(dict, spellings, core_readings_b, true);
                        if(possibilities.length == 0)
                            possibilities = json_lookup_kanji(dict, spellings, readings, true);
                    }
                    
                    if(possibilities.length > 0)
                        json_data = copy(dict.entries[possibilities[0]]);
                }
                else
                {
                    let possibilities = json_lookup_kana_exact(foundtext);
                    if(!other_settings.strict_epwing)
                    {
                        for(let reading of entry.r_ele)
                        {
                            if(possibilities.length == 0)
                                possibilities = json_lookup_kana_exact(reading.reb);
                        }
                        if(possibilities.length == 0)
                            possibilities = json_lookup_kana_inexact(foundtext);
                        for(let reading of entry.r_ele)
                        {
                            if(possibilities.length == 0)
                                possibilities = json_lookup_kana_inexact(reading.reb);
                        }
                    }
                    if(possibilities.length > 0)
                        json_data = copy(dict.entries[possibilities[0]]);
                }
                
                if(json_data)
                {
                    // add dictionary title
                    json_data["z"] = dict.name;
                    // add to lookup
                    entry.json.push(json_data);
                }
            }
        }
    }
    return lookups;
}



function is_kana(object)
{
    if(object.seq && object.k_ele)
        return false;
    if(object.seq)
        return true;
    if(typeof object !== "string")
        return false;
    
    for(let i = 0; i < object.length; i++)
    {
        let codepoint = object.codePointAt(i);
        if(!(codepoint >= 0x3040 && codepoint <= 0x30FF))
            return false;
    }
    return true;
}

function prefers_kana(object)
{
    if(object.seq)
    {
        for(let sense of object.sense)
        {
            if(sense.misc) for(let misc of sense.misc)
            {
                if(clip(misc) == "uk" || clip(misc) == "ek")
                    return true;
            }
        }
    }
    return false;
}
function prefers_kanji(object)
{
    if(object.seq)
    {
        for(let sense of object.sense)
        {
            if(sense.misc) for(let misc of sense.misc)
            {
                if(clip(misc) == "uK" || clip(misc) == "eK")
                    return true;
            }
        }
    }
    return false;
}

function all_senses_have_a_tag(object, tag)
{
    if(object.seq)
    {
        for(let sense of object.sense)
        {
            let anymatch = false;
            if(sense.misc)
            {
                for(let misc of sense.misc)
                {
                    if(tag.length)
                    {
                        for(let actualtag of tag)
                            if(clip(misc) == actualtag)
                                anymatch = true;
                    }
                    else if(clip(misc) == tag)
                        anymatch = true;
                }
            }
            if(!anymatch)
                return false;
        }
        return true;
    }
    return false;
}

function has_pri(object)
{
    if(object.seq)
    {
        for(let sense of object.sense)
        {
            if(object.k_ele) for(let ele of object.k_ele)
            {
                if(ele.pri)
                    return true;
            }
            if(object.r_ele) for(let ele of object.r_ele)
            {
                if(ele.pri)
                    return true;
            }
        }
    }
    return false;
}

function weird_lookup(found)
{
    if(found && found.inf)
    {
        for(let info of found.inf)
        {
            if(["ik", "iK", "io", "ok", "oK"].includes(clip(info)))
                return true;
        }
    }
}

function sort_results(text, results)
{
    if(results == undefined) return;
    
    let reading_kana = is_kana(text);
    
    for(let entry of results)
    {
        let result_kana = is_kana(entry);
        entry.priority = (entry.seq-1000000)/-10000000; // divided by one more order of magnitude
        
        if(weird_lookup(entry.found))
            entry.priority -= 50;
        if(reading_kana == result_kana && !entry.deconj) // !entry.deconj fixes なって
            entry.priority += 100;
        if(has_pri(entry))
            entry.priority += 30;
        if((!reading_kana) == prefers_kanji(entry))
            entry.priority += 12;
        if(reading_kana == prefers_kana(entry))
            entry.priority += 10;
        // moves さき below まえ for 前
        if(entry.k_ele && entry.k_ele.length == 1 && !weird_lookup(entry.k_ele[0]))
            entry.priority += 4;
        // moves まえ above ぜん for 前
        if(entry.sense && entry.sense.length >= 6)
            entry.priority += 1;
        if(entry.sense && entry.sense.length >= 3)
            entry.priority += 3;
        // FIXME: affects words with only one obscure/rare/obsolete sense
        if(all_senses_have_a_tag(entry, ["obsc", "rare", "obs"]))
            entry.priority -= 5;
        // FIXME: prefer short deconjugations to long deconjugations, not just no deconjugations to any deconjugations
        if(entry.deconj)
            entry.priority -= 1;
    }
    
    results.sort((a,b)=>
    {
        return b.priority - a.priority;
        //return a.priority - b.priority;
    });
    
    return results;
}

function filter_kana_ish_results(results)
{
    if(results == undefined) return;
    let newresults = [];
    for(let entry of results)
    {
        if(is_kana(entry) || prefers_kana(entry))
            newresults.push(entry);
    }
    return newresults;
}

function copy(orig)
{
    if(orig === undefined)
        return undefined;
    let mine;
    if (Set.prototype.isPrototypeOf(orig))
        mine = new Set(orig);
    else
        mine = Object.assign({}, orig);
    for(let f in mine)
    {
        if(f !== orig)
            f = copy(f);
    }
    return mine;
}
function copy_gen(orig)
{
    return orig.slice(0);
}

// Restrict the listed spellings/readings of a JMdict entry to the ones allowed by the looked-up text.
function restrict_by_text(entry, text)
{
    // deep clone lol (we should probably do this WAY earlier)
    let term = copy(entry);
    if(!term.found) // bogus lookup
        return term;
    
    // Example restrictions:
    //  ゆう: 夕 only
    //  さくや: 昨夜 only
    //  evening: 夕・夕べ only
    //  last night: ゆうべ・さくや only
    // Derived:
    //  昨夜： さくや・ゆうべ only
    //  夕： ゆう・ゆうべ only
    //  夕べ： ゆうべ only
    //  evening: ゆう・ゆうべ only
    //  last night: 夕べ・昨夜 only
    
    // if we didn't look up kanji, look for the first fitting kanji spellings in the entry (they're ordered sensibly) if there are kanji spellings
    term.orig_found = term.found;
    if(!!(term.found.reb) && term.k_ele) 
    {
        let r_restr = undefined;
        // kanji to which the reb is restricted
        if(term.found.restr && term.found.restr.length > 0)
            r_restr = term.found.restr;
        if(!r_restr)
            r_restr = [];
        
        // find the first kanji-including spelling that isn't restricted to readings that aren't the one we looked up
        for(let j = 0; j < term.k_ele.length; j++)
        {
            // if this spelling is restricted to particular readings
            if(term.k_ele[j].restr)
            {
                for(let l = 0; l < term.k_ele[j].restr.length; l++)
                {
                    // if the reading we looked up is one of the ones it's restricted to
                    // if the reading we looked up isn't restricted to spellings other than this one
                    if(term.k_ele[j].restr[l] == term.found.reb && (r_restr.length == 0 || r_restr.indexOf(term.k_ele[j].keb) > -1))
                    {
                        // pretend we looked up this spelling
                        term.found = term.k_ele[j];
                        break;
                    }
                }
            }
            // if the spelling does not have restrictions
            // if the reading is not restricted to other spellings
            else if(r_restr.length == 0 || r_restr.indexOf(term.k_ele[j].keb) > -1)
            {
                // pretend we looked up this spelling
                term.found = term.k_ele[j];
                break;
            }
        }
    }
    
    // eliminate unfitting kanji spellings if we originally looked up a reading
    if(!!(term.orig_found.reb) && term.k_ele)
    {
        let r_restr = undefined;
        // kanji to which the reb is restricted
        if(term.orig_found.restr && term.orig_found.restr.length > 0)
            r_restr = term.orig_found.restr;
        else
            r_restr = [];
        
        let new_k_ele = [];
        for(let j = 0; j < term.k_ele.length; j++)
        {
            if(r_restr.length > 0 && r_restr.indexOf(term.k_ele[j].keb) < 0)
                continue;
            // if this spelling is restricted to particular readings
            if(term.k_ele[j].restr)
            {
                for(let l = 0; l < term.k_ele[j].restr.length; l++)
                    // if the reading we looked up is one of the ones it's restricted to
                    // if the reading we looked up isn't restricted to spellings other than this one
                    if(term.k_ele[j].restr[l] == term.orig_found.reb)
                        new_k_ele.push(term.k_ele[j]);
            }
            // if the spelling does not have restrictions
            // if the reading is not restricted to other spellings
            else
                new_k_ele.push(term.k_ele[j]);
        }
        term.k_ele = new_k_ele;
    }
    // eliminate unfitting readings if we originally looked up a spelling
    if(!!(term.orig_found.keb) && term.r_ele)
    {
        let k_restr = undefined;
        // kanji to which the reb is restricted
        if(term.orig_found.restr && term.orig_found.restr.length > 0)
            k_restr = term.orig_found.restr;
        else
            k_restr = [];
        
        let new_r_ele = [];
        for(let j = 0; j < term.r_ele.length; j++)
        {
            if(k_restr.length > 0 && k_restr.indexOf(term.r_ele[j].reb) < 0)
                continue;
            if(term.r_ele[j].restr)
            {
                for(let l = 0; l < term.r_ele[j].restr.length; l++)
                    if(term.r_ele[j].restr[l] == term.orig_found.keb)
                        new_r_ele.push(term.r_ele[j]);
            }
            else
                new_r_ele.push(term.r_ele[j]);
        }
        term.r_ele = new_r_ele;
    }
    // eliminate unfitting definitions for the original lookup
    if(term.sense)
    {
        let new_sense = [];
        for(let j = 0; j < term.sense.length; j++)
        {
            if(term.orig_found.keb && term.sense[j].stagk)
            {
                for(let l = 0; l < term.sense[j].stagk.length; l++)
                    if(term.sense[j].stagk[l] == term.orig_found.keb)
                        new_sense.push(term.sense[j]);
            }
            else if(term.orig_found.reb && term.sense[j].stagr)
            {
                for(let l = 0; l < term.sense[j].stagr.length; l++)
                    if(term.sense[j].stagr[l] == term.orig_found.reb)
                        new_sense.push(term.sense[j]);
            }
            
            // if the spelling does not have restrictions
            // if the reading is not restricted to other spellings
            else
                new_sense.push(term.sense[j]);
        }
        term.sense = new_sense;
    }
    
    return term;
}

function add_extra_info(results, other_settings)
{
    for(let lookup of results)
    {
        for(let entry of lookup.result)
        {
            entry.has_audio = [];
            if(!entry.k_ele || entry.k_ele.length == 0)
            {
                for(let r of entry.r_ele)
                {
                    if(lookup_audio.has(r.reb))
                        entry.has_audio.push(r.reb);
                    else if(lookup_audio_broken.has(r.reb))
                        entry.has_audio.push(lookup_audio_broken.get(r.reb));
                }
            }
            else if(entry.k_ele)
            {
                for(let k of entry.k_ele)
                {
                    for(let r of entry.r_ele)
                    {
                        let test_string = r.reb + ";" + k.keb;
                        if(lookup_audio.has(test_string))
                            entry.has_audio.push(test_string);
                        else if(lookup_audio_broken.has(test_string))
                            entry.has_audio.push(lookup_audio_broken.get(test_string));
                    }
                }
            }
        }
    }
    return add_json_info(results, other_settings);
}

// Skip JMdict entries reappearing in alternative lookups (so only the first one is shown)
function skip_rereferenced_entries(results, other_settings)
{
    let newresults = [];
    let seenseq = new Set();
    
    for(let lookup of results)
    {
        let newlookup = [];
        for(let entry of lookup.result)
        {
            if(seenseq.has(entry.seq))
                continue;
            seenseq.add(entry.seq);
            newlookup.push(restrict_by_text(entry, lookup.text));
        }
        if(newlookup.length > 0)
            newresults.push({text:lookup.text, result:newlookup});
    }
    return add_extra_info(newresults, other_settings); // add extra information like json results and audio data now
}

let last_lookup = "";
function lookup_indirect(text, time, divexisted, other_settings)
{
    if(text == "")
        return;
    if(text == last_lookup && divexisted)
        return "itsthesame";
    last_kanji_lookup = "";
    last_lookup = text;
    
    // try to look up successively shorter substrings of text
    // deconjugate() returns possible deconjugations, one of which has zero deconjugations, i.e. the plain text
    // build_lookup_comb looks for dictionary definitions matching any deconjugation, returning a list of them
    // FIXME: later lookups using definitions already caught
    if(other_settings.alternatives_mode == 0 || other_settings.alternatives_mode == 1 || other_settings.alternatives_mode == 2)
    {
        let forms = deconjugate(text);
        let result = build_lookup_comb(forms);
        while(result === undefined && text.length > 0)
        {
            text = text.substring(0, text.length-1);
            forms = deconjugate(text);
            result = build_lookup_comb(forms);
        }
        if(result !== undefined && result.length > 0)
        {
            result = sort_results(text, result);
            if(other_settings.alternatives_mode == 0 || text.length <= 1)
                return skip_rereferenced_entries([{text:text, result:result}], other_settings);
            else if(other_settings.alternatives_mode == 1) // second longest too 
            {
                let len = text.length-1;
                let short_text = text.substring(0, len);
                let short_forms = deconjugate(short_text);
                let short_result = build_lookup_comb(short_forms);
                
                while(short_result === undefined && len > 0)
                {
                    len--;
                    short_text = text.substring(0, len);
                    short_forms = deconjugate(short_text);
                    short_result = build_lookup_comb(short_forms);
                }
                if(other_settings.strict_alternatives && is_kana(short_text))
                    short_result = filter_kana_ish_results(short_result);
                if(short_result !== undefined && short_result.length > 0)
                {
                    short_result = sort_results(short_text, short_result);
                    return skip_rereferenced_entries([{text:text, result:result}, {text:short_text, result:short_result}], other_settings);
                }
                else
                    return skip_rereferenced_entries([{text:text, result:result}], other_settings);
            }
            else if(other_settings.alternatives_mode == 2) // shortest too
            {
                let len = 1;
                let short_text = text.substring(0, len);
                let short_forms = deconjugate(short_text);
                let short_result = build_lookup_comb(short_forms);
                
                while(short_result === undefined && short_text.length+1 < text.length)
                {
                    len++;
                    short_text = text.substring(0, len);
                    short_forms = deconjugate(short_text);
                    short_result = build_lookup_comb(short_forms);
                }
                if(other_settings.strict_alternatives && is_kana(short_text))
                    short_result = filter_kana_ish_results(short_result);
                if(short_result !== undefined && short_result.length > 0)
                {
                    short_result = sort_results(short_text, short_result);
                    return skip_rereferenced_entries([{text:text, result:result}, {text:short_text, result:short_result}], other_settings);
                }
                else
                    return skip_rereferenced_entries([{text:text, result:result}], other_settings);
            }
        }
    }
    else if(other_settings.alternatives_mode == 3)
    {
        let results = [];
        let first = true;
        while(text.length > 0)
        {
            let forms = deconjugate(text);
            let result = build_lookup_comb(forms);
            
            if(!first && other_settings.strict_alternatives && is_kana(text))
                result = filter_kana_ish_results(result);
            
            if(result !== undefined && result.length > 0)
            {
                result = sort_results(text, result);
                results.push({text:text, result:result});
            }
            text = text.substring(0, text.length-1);
            if(results.length > 0)
                first = false;
        }
        if(results.length > 0)
            return skip_rereferenced_entries(results, other_settings);
    }
}



let last_kanji_lookup = "";
function lookup_kanji_character(c, divexisted)
{
    if(c == "")
        return;
    if(c == last_kanji_lookup && divexisted)
        return "itsthesame";
    last_kanji_lookup = c;
    last_lookup = "";
    
    try
    {
        return copy(kanji_data.get(c));
    }
    catch (err)
    {
        return undefined;
    }
}

async function update_icon(enabled)
{
    if(enabled)
    {
        browser.browserAction.setTitle({title:"Nazeka (enabled)"});
        try
        {
            browser.browserAction.setIcon({path:{
                "16": "img/enabled16.png",
                "32": "img/enabled32.png",
                "512": "img/enabled512.png"
            }},);
        } catch (err) {}
    }
    else
    {
        browser.browserAction.setTitle({title:"Nazeka (disabled)"});
        try
        {
            browser.browserAction.setIcon({path:{
                "16": "img/action16.png",
                "32": "img/action32.png",
                "512": "img/action512.png"
            }},);
        } catch (err) {}
    }
}

async function toggle_enabled()
{
    let enabled = (await browser.storage.local.get("enabled")).enabled;
    if(enabled == undefined)
        enabled = false;
    enabled = !enabled;
    browser.storage.local.set({enabled: enabled});
    update_icon(enabled);
}

async function fixicon()
{
    let enabled = (await browser.storage.local.get("enabled")).enabled;
    if(enabled == undefined)
        enabled = false;
    update_icon(enabled);
}

async function init_icon()
{
    browser.browserAction.onClicked.addListener(toggle_enabled);
    fixicon();
}

init_icon();

function open_reader(info, tab)
{
    try
    {
        browser.windows.create({
            url:browser.extension.getURL("reader.html"),
            type:"popup",
            width:settings.reader_width,
            height:settings.reader_height
        });
    } catch(err) {}
}
function open_mining(info, tab)
{
    try
    {
        browser.windows.create({
            url:browser.extension.getURL("mining.html"),
            type:"popup"
        });
    } catch(err) {}
}
function open_livemining(info, tab)
{
    try
    {
        browser.windows.create({
            url:browser.extension.getURL("livemining.html"),
            type:"popup"
        });
    } catch(err) {}
}
function open_jsonconfig(info, tab)
{
    try
    {
        browser.windows.create({
            url:browser.extension.getURL("json_config.html"),
            type:"popup"
        });
    } catch(err) {}
}

if(browser.contextMenus)
{
    browser.contextMenus.create({
        id: "nazeka-reader",
        title: "Open Reader",
        contexts: ["browser_action"],
        onclick: open_reader
    });
    browser.contextMenus.create({
        id: "nazeka-mining",
        title: "View Mined Cards",
        contexts: ["browser_action"],
        onclick: open_mining
    });
    browser.contextMenus.create({
        id: "nazeka-livemining",
        title: "Configure Live Mining",
        contexts: ["browser_action"],
        onclick: open_livemining
    });
    browser.contextMenus.create({
        id: "nazeka-jsonconfig",
        title: "Manage JSON Dictionaries",
        contexts: ["browser_action"],
        onclick: open_jsonconfig
    });
}

let origin_tab = undefined;

function set_up_paste_overload()
{
    document.querySelector("#nazeka-paste-target").addEventListener("paste", (event) =>
    {
        // skip event if there's no plaintext; thanks github.com/kmltml/clipboard-inserter
        let text = event.clipboardData.getData("text/plain");
        event.preventDefault();
        
        if(origin_tab != undefined)
            browser.tabs.sendMessage(origin_tab.id, {type:"text",text:text});
    });
}

if (document.readyState == "complete")
    set_up_paste_overload();
else
    document.addEventListener("DOMContentLoaded", set_up_paste_overload);

function clipboard_hook(tab)
{
    origin_tab = tab;
    let target = document.querySelector("#nazeka-paste-target");
    target.textContent = "";
    target.focus();
    document.execCommand("paste");
}

let platform = "";
async function get_real_platform()
{
    let platformInfo = await browser.runtime.getPlatformInfo();
    if(platformInfo)
        platform = platformInfo.os;
    console.log(`platform is ${platform}`);
}
get_real_platform();

function send_error(tab, error)
{
    try
    {
        browser.tabs.sendMessage(tab, {type:"error",error:error});
    } catch (err) {}
}

browser.runtime.onMessage.addListener((req, sender) =>
{
    if (req.type == "search")
    {
        let asdf = lookup_indirect(req.text, req.time, req.divexisted, req.settings);
        return Promise.resolve({"response" : asdf});
    }
    if (req.type == "search_kanji")
    {
        let asdf = lookup_kanji_character(req.text, req.divexisted);
        return Promise.resolve({"response" : asdf});
    }
    else if (req.type == "platform")
    {
        return Promise.resolve({"response" : platform});
    }
    else if (req.type == "fixicon")
    {
        fixicon();
    }
    else if (req.type == "gimmetext")
    {
        clipboard_hook(sender.tab);
    }
    else if (req.type == "refreshjson")
    {
        refresh_json();
    }
    else if (req.type == "ankiconnect_mine")
    {
        console.log("got request");
        let xhr = new XMLHttpRequest();
        xhr.open("POST", req.host, true);
        //xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
        console.log(req.command);
        xhr.addEventListener('load', () =>
        {
            console.log(xhr.responseText);
            let response = JSON.parse(xhr.responseText);
            try
            {
                if(response.error)
                    send_error(sender.tab.id, "AnkiConnect mining failed: " + response.error);
            } catch (e) { }
        });
        xhr.addEventListener('error', () =>
        {
            send_error(sender.tab.id, "AnkiConnect mining failed: unspecified error (Anki is probably not open)");
        });
        xhr.addEventListener('timeout', () =>
        {
            send_error(sender.tab.id, "AnkiConnect mining failed: timed out");
        });
        xhr.send(req.command);
    }
    else if (req.type == "play_audio")
    {
        let audio = new Audio(req.host);
        audio.volume = req.volume;
        audio.play();
        console.log("tried to play audio");
        console.log(req.host);
    }
    return Promise.resolve(undefined);
});

browser.contextMenus.create({
    id: "nazeka-toggle",
    title: "Toggle Nazeka",
    contexts: ["page", "selection"],
    documentUrlPatterns: ["moz-extension://*/reader.html"],
    onclick: toggle_enabled
});
