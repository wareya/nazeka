// Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0

'use strict';

// We use JMdict converted to JSON. It's like 32MB so we don't want to load it for every tab.
// So we need to use a background script and send messages to it from the content script.
// Unfortunately webextensions don't have an easy way to load files, even from in the extension.
// We have to send an HTTP request and store the result in a string before parsing it into an object.
// Seriously.

let epwing = [];
let lookup_epwing_kan = new Map();
let lookup_epwing_kana = new Map();

async function refresh_epwing()
{
    let myjson = (await browser.storage.local.get("epwing"))["epwing"];
    epwing = JSON.parse(myjson);
    lookup_epwing_kan = new Map();
    lookup_epwing_kana = new Map();
    for (let i = 1; i < epwing.length; i++)
    {
        if(typeof epwing[i] === 'string' || epwing[i] instanceof String)
            continue;
        add_epwing_id(epwing[i]["r"], i);
        for(let spelling of epwing[i]["s"])
            add_epwing_id(spelling, i);
    }
}
refresh_epwing();

function string_is_kana(str)
{
    for(let i = 0; i < str.length; i++)
    {
        let codepoint = str.codePointAt(i);
        if(!(codepoint >= 0x3040 && codepoint <= 0x30FF))
            return false;
    }
    return true;
}

function add_epwing_id(id, i)
{
    if(id === "")
        return;
    if(string_is_kana(id))
    {
        if (!lookup_epwing_kana.has(id))
            lookup_epwing_kana.set(id, [i]);
        else
            lookup_epwing_kana.get(id).push(i);
    }
    else
    {
        if (!lookup_epwing_kan.has(id))
            lookup_epwing_kan.set(id, [i]);
        else
            lookup_epwing_kan.get(id).push(i);
    }
}


let dict = [];
let lookup_kan = new Map();
let lookup_kana = new Map();

let dictsloaded = 0;

function builddict()
{
    //console.log("load");
    //console.log(this);
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

/*
function handle_error()
{
    console.log("error");
    console.log(this.responseURL);
}

function handle_progress()
{
    console.log("progress");
    console.log(this.responseURL);
}

function handle_abort()
{
    console.log("abort");
    console.log(this.responseURL);
}

function handle_timeout()
{
    console.log("timeout");
    console.log(this.responseURL);
}
*/

// Having a >4MB flat text file with stupid adhoc formatting is okay
// but having a >4MB json file with nothing weird in it isn't
// Thanks, linter team!
function load_part_of_dictionary(filename)
{
    let req = new XMLHttpRequest();
    req.addEventListener("load", builddict);
    /*
    req.addEventListener("error", handle_error);
    req.addEventListener("progress", handle_progress);
    req.addEventListener("abort", handle_abort);
    req.addEventListener("timeout", handle_timeout);
    */
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

// TODO: load rules from an underlay

////////////////////
// verb stems
////////////////////

// "e" stem used for potential and ba
rules.push({type: "neverfinalrule"
, dec_end:
["く","す","つ","う","る","ぐ","ぶ","ぬ","む","る","う","く"]
, con_end:
["け","せ","て","え","れ","げ","べ","ね","め","れ","え","け"]
, dec_tag:
["v5k","v5s","v5t","v5u","v5r","v5g","v5b","v5n","v5m","v1","v5u-s","v5k-s"]
, con_tag:"stem-izenkei", detail:"(izenkei)"});
// the potential of v5r-i verbs does not use a simple e ending, it uses the ren'youkei (infinitive) followed by える, thus ありえる
rules.push({type: "neverfinalrule", dec_end:"る", con_end:"れ", dec_tag: "v5r-i", con_tag:"stem-e", detail:"(izenkei)"});
rules.push({type: "neverfinalrule", dec_end:"", con_end:"", dec_tag: "stem-izenkei", con_tag:"stem-e", detail:""});

// true imperative
rules.push({type: "onlyfinalrule"
, dec_end:
["く","す","つ","う","る","る","ぐ","ぶ","ぬ","む","る","る","う","く"]
, con_end:
["け","せ","て","え","れ","れ","げ","べ","ね","め","ろ","よ","え","け"] // ichidan has two imperatives FIXME: don't let potential conjugate to よ
, dec_tag:
["v5k","v5s","v5t","v5u","v5r","v5r-i","v5g","v5b","v5n","v5m","v1","v1","v5u-s","v5k-s"]
, con_tag:"uninflectable", detail:"imperative"});

// ~a stem
rules.push({type: "neverfinalrule"
, dec_end:
["く","す","つ","う","る","ぐ","ぶ","ぬ","む","う","く"]
, con_end:
["か","さ","た","わ","ら","が","ば","な","ま","わ","か"]
, dec_tag:
["v5k","v5s","v5t","v5u","v5r","v5g","v5b","v5n","v5m","v5u-s","v5k-s"] // TODO: support あらへん, あらぬ, etc
, con_tag:"stem-a", detail:"('a' stem)"});

// unvoiced past stems
rules.push({type: "neverfinalrule"
, dec_end:
["く","す","つ","う","る","る","る","う","く"]
, con_end:
["い","し","っ","っ","っ","っ","","う","っ"]
, dec_tag:
["v5k","v5s","v5t","v5u","v5r","v5r-i","v1","v5u-s","v5k-s"]
, con_tag:"stem-ren-less", detail:"(unstressed infinitive)"});
// voiced past stems
rules.push({type: "neverfinalrule"
, dec_end:
["ぐ","ぶ","ぬ","む"]
, con_end:
["い","ん","ん","ん"]
, dec_tag:
["v5g","v5b","v5n","v5m"]
, con_tag:"stem-ren-less-v", detail:"(unstressed infinitive)"});

// infinitives (ren'youkei) that are different than the corresponding past stem
rules.push({type: "stdrule"
, dec_end:
["く","つ","う","る","る","ぐ","ぶ","ぬ","む","う","く"]
, con_end:
["き","ち","い","り","り","ぎ","び","に","み","い","き"]
, dec_tag:
["v5k","v5t","v5u","v5r","v5r-i","v5g","v5b","v5n","v5m","v5u-s","v5k-s"]
, con_tag:"stem-ren", detail:"(infinitive)"});
// ones that need the te trap
rules.push({type: "contextrule", contextrule:"tetrap"
, dec_end:
["す","る"]
, con_end:
["し",""]
, dec_tag:
["v5s","v1"]
, con_tag:"stem-ren", detail:"(infinitive)"});

// stem for negatives proper
rules.push({type: "neverfinalrule"
, dec_end:
["","る"]
, con_end:
["",""]
, dec_tag:
["stem-a","v1"]
, con_tag:"stem-mizenkei", detail:"(mizenkei)"});

// ~a stem
rules.push({type: "stdrule"
, dec_end:
["く","す","つ","う","る","る","ぐ","ぶ","ぬ","む","る","う","く"]
, con_end:
["こう","そう","とう","おう","ろう","ろう","ごう","ぼう","のう","もう","よう","おう","こう"]
, dec_tag:
["v5k","v5s","v5t","v5u","v5r","v5r-i","v5g","v5b","v5n","v5m","v1","v5u-s","v5k-s"]
, con_tag:"form-volition", detail:"volitional"});

////////////////////
// adjective stems
////////////////////

rules.push({type: "stdrule", dec_end:"い", con_end:"く", dec_tag:"adj-i", con_tag:"stem-ku", detail:"(adverbial stem)"});
rules.push({type: "stdrule", dec_end:"い", con_end:"か", dec_tag:"adj-i", con_tag:"stem-ka", detail:"(ka stem)"});
rules.push({type: "stdrule", dec_end:"い", con_end:"け", dec_tag:"adj-i", con_tag:"stem-ke", detail:"(ke stem)"});
rules.push({type: "stdrule", dec_end:"い", con_end:"", dec_tag:"adj-i", con_tag:"stem-adj-base", detail:"(stem)"});

// TODO move these
// Forms based on the bare adjective stem
rules.push({type: "stdrule", dec_end:"", con_end:"すぎる", dec_tag:"stem-adj-base", con_tag:"v1", detail:"excess"});
rules.push({type: "stdrule", dec_end:"", con_end:"そう", dec_tag:"stem-adj-base", con_tag:"adj-na", detail:"seemingness"});
rules.push({type: "stdrule", dec_end:"", con_end:"がる", dec_tag:"stem-adj-base", con_tag:"v5r", detail:"garu"});
rules.push({type: "stdrule", dec_end:"", con_end:"さ", dec_tag:"stem-adj-base", con_tag:"n", detail:"noun form"});

////////////////////
// common forms
////////////////////

// rules.push({type: "stdrule", dec_end:"", con_end:"た", dec_tag:"stem-ren", con_tag:"stem-past", detail:"past"}); // unusual but real but don't necessarily want it yet
rules.push({type: "stdrule", dec_end:"", con_end:"た", dec_tag:"stem-ren-less", con_tag:"stem-past", detail:"past"});
rules.push({type: "stdrule", dec_end:"", con_end:"だ", dec_tag:"stem-ren-less-v", con_tag:"stem-past", detail:"past"});
// rules.push({type: "stdrule", dec_end:"", con_end:"て", dec_tag:"stem-ren", con_tag:"stem-te", detail:"(te form)"}); // unusual but real but don't necessarily want it yet
rules.push({type: "stdrule", dec_end:"", con_end:"った", dec_tag:"stem-ka", con_tag:"stem-past", detail:"past"});

// we may want some te forms to only apply to verbs, not adjectives
// FIXME: need a way to not break ～ないでください, ~ないでいく, etc before we actually do it
rules.push({type: "stdrule", dec_end:"", con_end:"て", dec_tag:"stem-ren-less", con_tag:"stem-te-verbal", detail:"(te form)"});
rules.push({type: "stdrule", dec_end:"", con_end:"で", dec_tag:"stem-ren-less-v", con_tag:"stem-te-verbal", detail:"(te form)"});
// tag alias
rules.push({type: "stdrule", dec_end:"", con_end:"", dec_tag:"stem-te-verbal", con_tag:"stem-te", detail:""});
// now the te form for adjectives
// adjectives have two te forms, one of which is not used synthetically
rules.push({type: "stdrule", dec_end:"", con_end:"で", dec_tag:"adj-i", con_tag:"stem-te", detail:"(te form)"});
rules.push({type: "stdrule", dec_end:"", con_end:"で", dec_tag:"stem-ku", con_tag:"stem-te-defective", detail:"(te form)"});

// doesn't have anywhere else to go
rules.push({type: "rewriterule", dec_end:"です", con_end:"でした", dec_tag:"exp", con_tag:"stem-past", detail:"past"});
rules.push({type: "rewriterule", dec_end:"です", con_end:"でして", dec_tag:"exp", con_tag:"stem-te-verbal", detail:"(te form)"});
// TODO: add te form of です? or would it be too confusing to have?
// e.g. it would let people find "でしている" in "自分でしている" as です instead of で + conjugated する

// negatives
rules.push({type: "contextrule", contextrule: "adjspecial", dec_end:"", con_end:"ない", dec_tag:"stem-mizenkei", con_tag:"adj-i", detail:"negative"});
rules.push({type: "stdrule", dec_end:"", con_end:"ん", dec_tag:"stem-mizenkei", con_tag:"adj-i", detail:"slurred negative"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ず", dec_tag:"stem-mizenkei", con_tag:"uninflectable", detail:"adverbial negative"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ずに", dec_tag:"stem-mizenkei", con_tag:"uninflectable", detail:"without doing so"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ぬ", dec_tag:"stem-mizenkei", con_tag:"uninflectable", detail:"archaic negative"});

rules.push({type: "contextrule", contextrule: "adjspecial", dec_end:"", con_end:"ない", dec_tag:"stem-ku", con_tag:"adj-i", detail:"negative"});

// special negative inflections where the intermediate stage (e.g. 赤くある) is not a synthetic phrase like the end result (e.g. 赤くありません) is
// FIXME: don't allow conjugating ～ない to this?
rules.push({type: "stdrule", dec_end:"", con_end:"ありません", dec_tag:"stem-ku", con_tag:"uninflectable", detail:"formal negative"});
rules.push({type: "stdrule", dec_end:"", con_end:"ありませんでした", dec_tag:"stem-ku", con_tag:"uninflectable", detail:"formal negative past"});


// masu and its conjugations (allowing it to conjugate recursively causes problems because its grammar is unlike typical declarative verbs)
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ます", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"polite"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ません", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"negative polite"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ました", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"past polite"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"まして", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"te polite"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ませんでした", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"past negative polite"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ましょう", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"polite volitional"});

////////////////////
// conditional forms
////////////////////

rules.push({type: "onlyfinalrule", dec_end:"", con_end:"たら", dec_tag:"stem-ren-less", con_tag:"uninflectable", detail:"conditional"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"だら", dec_tag:"stem-ren-less-v", con_tag:"uninflectable", detail:"conditional"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ったら", dec_tag:"stem-ka", con_tag:"uninflectable", detail:"conditional"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"たらば", dec_tag:"stem-ren-less", con_tag:"uninflectable", detail:"formal conditional"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"だらば", dec_tag:"stem-ren-less-v", con_tag:"uninflectable", detail:"formal conditional"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ったらば", dec_tag:"stem-ka", con_tag:"uninflectable", detail:"formal conditional"});

rules.push({type: "stdrule", dec_end:"", con_end:"ば", dec_tag:"stem-e", con_tag:"uninflectable", detail:"provisional conditional"});
rules.push({type: "stdrule", dec_end:"", con_end:"れば", dec_tag:"stem-ke", con_tag:"uninflectable", detail:"provisional conditional"});

////////////////////
// non-analytical forms
////////////////////

//passive and potential
rules.push({type: "stdrule", dec_end:"", con_end:"る", dec_tag:"stem-izenkei", con_tag:"v1", detail:"potential"}); // FIXME don't allow to attach to the short causative
rules.push({type: "stdrule", dec_end:"る", con_end:"りえる", dec_tag:"v5r-i", con_tag:"v1", detail:"potential"}); // v5r-i verbs have an irregular potential
// note: ichidan (i.e. v1) verbs cannot conjugate to stem-a
rules.push({type: "stdrule", dec_end:"", con_end:"れる", dec_tag:"stem-a", con_tag:"v1", detail:"passive"});
rules.push({type: "stdrule", dec_end:"る", con_end:"られる", dec_tag:"v1", con_tag:"v1", detail:"passive/potential"});

// causative
rules.push({type: "stdrule", dec_end:"", con_end:"せる", dec_tag:"stem-a", con_tag:"v1", detail:"causative"});
rules.push({type: "stdrule", dec_end:"る", con_end:"させる", dec_tag:"v1", con_tag:"v1", detail:"causative"});
rules.push({type: "contextrule", contextrule: "saspecial", dec_end:"", con_end:"す", dec_tag:"stem-a", con_tag:"v5s", detail:"short causative"});

////////////////////
// te-based forms
////////////////////

// mere te auxiliaries
rules.push({type: "stdrule", dec_end:"", con_end:"しまう", dec_tag:"stem-te", con_tag:"v5u", detail:"finish/completely/end up"});
// personal te auxiliaries
rules.push({type: "stdrule", dec_end:"", con_end:"ください", dec_tag:"stem-te", con_tag:"adj-i", detail:"polite request"});
rules.push({type: "stdrule", dec_end:"", con_end:"あげる", dec_tag:"stem-te", con_tag:"v5r", detail:"do for someone"});
// grammatical aspect forms
// FIXME: add the てる とる etc. conjugations; though the てる conjugation needs a bunch of annoying traps
rules.push({type: "stdrule", dec_end:"", con_end:"いる", dec_tag:"stem-te", con_tag:"v1", detail:"teiru"});
rules.push({type: "stdrule", dec_end:"", con_end:"おる", dec_tag:"stem-te", con_tag:"v5r", detail:"teoru"});
rules.push({type: "stdrule", dec_end:"", con_end:"ある", dec_tag:"stem-te", con_tag:"v5r-i", detail:"tearu"});
rules.push({type: "stdrule", dec_end:"", con_end:"いく", dec_tag:"stem-te", con_tag:"v5k-s", detail:"teiku"});
rules.push({type: "stdrule", dec_end:"", con_end:"くる", dec_tag:"stem-te", con_tag:"vk", detail:"tekuru"});
rules.push({type: "stdrule", dec_end:"", con_end:"おく", dec_tag:"stem-te", con_tag:"v5k", detail:"for now"});
// nonverbal functions of the te form
rules.push({type: "stdrule", dec_end:"", con_end:"は", dec_tag:"stem-te", con_tag:"uninflectable", detail:"topic"});
rules.push({type: "stdrule", dec_end:"", con_end:"は", dec_tag:"stem-te-defective", con_tag:"uninflectable", detail:"topic"});
// TODO: ても too?

////////////////////
// ren'youkei based forms
////////////////////

rules.push({type: "onlyfinalrule", dec_end:"", con_end:"なさい", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"kind request"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"な", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"casual kind request"});

rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ながら", dec_tag:"stem-ren", con_tag:"uninflectable", detail:"while"});

rules.push({type: "onlyfinalrule", dec_end:"", con_end:"たり", dec_tag:"stem-ren-less", con_tag:"uninflectable", detail:"tari"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"だり", dec_tag:"stem-ren-less-v", con_tag:"uninflectable", detail:"tari"});
rules.push({type: "onlyfinalrule", dec_end:"", con_end:"ったり", dec_tag:"stem-ka", con_tag:"uninflectable", detail:"tari"});

rules.push({type: "contextrule", contextrule:"adjspecial", dec_end:"", con_end:"たい", dec_tag:"stem-ren", con_tag:"adj-i", detail:"want"});

rules.push({type: "stdrule", dec_end:"", con_end:"すぎる", dec_tag:"stem-ren", con_tag:"v1", detail:"too much"});

////////////////////
// transparent contractions
////////////////////
rules.push({type: "stdrule", dec_end:"てしまう", con_end:"ちゃう", dec_tag:"v5u", con_tag:"v5u", detail:"(contraction)"});
rules.push({type: "stdrule", dec_end:"でしまう", con_end:"じゃう", dec_tag:"v5u", con_tag:"v5u", detail:"(contraction)"});
rules.push({type: "stdrule", dec_end:"てしまう", con_end:"ちまう", dec_tag:"v5u", con_tag:"v5u", detail:"(contraction)"});
rules.push({type: "stdrule", dec_end:"でしまう", con_end:"じまう", dec_tag:"v5u", con_tag:"v5u", detail:"(contraction)"});

rules.push({type: "stdrule", dec_end:"ては", con_end:"ちゃ", dec_tag:"stem-te", con_tag:"uninflectable", detail:"(contraction)"});
rules.push({type: "stdrule", dec_end:"では", con_end:"じゃ", dec_tag:"stem-te", con_tag:"uninflectable", detail:"(contraction)"});

rules.push({type: "onlyfinalrule", dec_end:"ければ", con_end:"けりゃ", dec_tag:"uninflectable", con_tag:"uninflectable", detail:"(contraction)"});
rules.push({type: "onlyfinalrule", dec_end:"ければ", con_end:"きゃ", dec_tag:"uninflectable", con_tag:"uninflectable", detail:"(contraction)"});

// other
rules.push({type: "onlyfinalrule", dec_end:"る", con_end:"ん", dec_tag:"v1", con_tag:"uninflectable", detail:"slurred"});
rules.push({type: "onlyfinalrule", dec_end:"る", con_end:"ん", dec_tag:"v5r", con_tag:"uninflectable", detail:"slurred"});
rules.push({type: "onlyfinalrule", dec_end:"る", con_end:"ん", dec_tag:"v5aru", con_tag:"uninflectable", detail:"slurred"});
rules.push({type: "onlyfinalrule", dec_end:"る", con_end:"ん", dec_tag:"vk", con_tag:"uninflectable", detail:"slurred"}); // FIXME: ?

// TODO: a bunch of missing contractions, vk, vs_i, v5aru, v4r, 

//rules.push({type: "stdrule", dec_end:"", con_end:"たい", dec_tag:"stem-ren", con_tag:"adj-i", detail:"want"});

// FIXME implement un-deconjugation to show the actual reading of the deconjugated word e.g. of 来る or 得る - this is what furigana rules are for

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
            //console.log("Returning from deconjugation: tag doesn't match");
            //console.log(my_form);
            //console.log(my_rule);
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
function contextrule_deconjugate(my_form, my_rule)
{
    if(!context_functions[my_rule.contextrule](my_form, my_rule))
        return;
    return stdrule_deconjugate(my_form, my_rule);
};

let rule_functions = {
stdrule: stdrule_deconjugate,
rewriterule: rewriterule_deconjugate,
onlyfinalrule: onlyfinalrule_deconjugate,
neverfinalrule: neverfinalrule_deconjugate,
contextrule: contextrule_deconjugate,
};

function adjspecial_check(my_form, my_rule)
{
    if(my_form.tags.length != 2) return true;
    let my_tag = my_form.tags[my_form.tags.length-2];
    if(my_tag == "stem-adj-base")
        return false;
    return true;
};
function tetrap_check(my_form, my_rule)
{
    if(my_form.tags.length < 2) return true;
    let my_tag = my_form.tags[my_form.tags.length-2];
    if(my_tag == "stem-te")
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
adjspecial: adjspecial_check,
tetrap: tetrap_check,
saspecial: saspecial_check,
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

// takes deconjugated forms and looks them up in a dictionary
// building a list of all matches
function build_lookup_comb (forms)
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
            if(entry.deconj)
            {
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

function add_epwing_info(lookups)
{
    for(let lookup of lookups)
    {
        for(let entry of lookup.result)
        {
            // look for an epwing entry that matches this lookup and jmdict entry
            let epwing_data = undefined;
            let foundtext = undefined;
            if(entry.orig_found.keb)
                foundtext = entry.orig_found.keb;
            else
                foundtext = entry.orig_found.reb;
            
            let exact = 0;
            // TODO: figure out which of these .includes() calls should be equality tests instead. definitely some of them, definitely not all of them.
            if(entry.k_ele)
            {
                for(let spelling of entry.k_ele)
                {
                    let text = spelling.keb;
                    if (lookup_epwing_kan.has(text))
                    {
                        let possibilities = copy_gen(lookup_epwing_kan.get(text));
                        
                        //console.log(text);
                        //console.log(possibilities);
                        
                        // FIXME this is disgusting
                        let priority = [];
                        for(let reading of entry.r_ele)
                        {
                            let rtext = reading.reb;
                            for(let wing of possibilities)
                            {
                                if(epwing[wing]["r"] === rtext)
                                    priority.push(wing);
                            }
                        }
                        for(let wing of priority)
                        {
                            var index = possibilities.indexOf(wing);
                            if (index > -1)
                                possibilities.splice(index, 1);
                        }
                        possibilities = priority.concat(possibilities);
                        priority = [];
                        
                        //console.log(possibilities);
                        
                        for(let wing of possibilities)
                        {
                            let epw = copy(epwing[wing]);
                            if(epw && epw["l"])
                            {
                                if(epwing_data == undefined)
                                {
                                    epwing_data = epw;
                                    exact = epw["r"].includes(foundtext);
                                    for(let spelling of epw["s"])
                                        exact |= spelling.includes(foundtext);
                                    // FIXME duplicated below
                                    if(exact)
                                    {
                                        for(let reading of entry.r_ele)
                                        {
                                            let rtext = reading.reb;
                                            if(epw["r"].includes(rtext))
                                                exact = 2;
                                        }
                                    }
                                }
                                else if(exact == 0)
                                {
                                    exact |= epw["r"].includes(foundtext);
                                    for(let spelling of epw["s"])
                                        exact |= spelling.includes(foundtext);
                                    if(exact)
                                    {
                                        for(let reading of entry.r_ele)
                                        {
                                            let rtext = reading.reb;
                                            if(epw["r"].includes(rtext))
                                                exact = 2;
                                        }
                                        epwing_data = epw;
                                    }
                                }
                                else if(exact == 1)
                                {
                                    let maybe_more_exact = epw["r"].includes(foundtext);
                                    for(let spelling of epw["s"])
                                        maybe_more_exact |= spelling.includes(foundtext);
                                    if(maybe_more_exact)
                                    {
                                        for(let reading of entry.r_ele)
                                        {
                                            let text = reading.reb;
                                            if(epw["r"].includes(text))
                                            {
                                                exact = 2;
                                                epwing_data = epw;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if(epwing_data == undefined && entry.r_ele)
            {
                for(let reading of entry.r_ele)
                {
                    let text = reading.reb;
                    
                    if (lookup_epwing_kana.has(text))
                    {
                        let possibilities = copy_gen(lookup_epwing_kana.get(text));
                        for(let wing of possibilities)
                        {
                            let epw = copy(epwing[wing]);
                            if(epw && epw["l"])
                            {
                                if(epwing_data == undefined)
                                {
                                    epwing_data = epw;
                                    exact = epw["r"].includes(foundtext);
                                }
                                else if(exact == 0)
                                {
                                    exact |= epw["r"].includes(foundtext);
                                    if(exact)
                                        epwing_data = epw;
                                }
                                else if(exact == 1)
                                {
                                    if(epw["s"].length == 1 && epw["s"][0] === "" && epw["r"].includes(foundtext))
                                    {
                                        exact = 2;
                                        epwing_data = epw;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            entry.epwing = epwing_data;
            if(entry.epwing && (typeof epwing[0] === 'string' || epwing[0] instanceof String))
                entry.epwing["z"] = epwing[0];
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
        //console.log(entry);
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

// https://stackoverflow.com/questions/4459928/how-to-deep-clone-in-javascript
function copy(orig)
{
    let mine = orig;

    mine = Object.assign({}, orig)
    for(let f in mine)
    {
        f = Object.assign({}, f)
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
    //console.log(entry);
    //console.log(term);
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

// Skip JMdict entries reappearing in alternative lookups (so only the first one is shown)
function skip_rereferenced_entries(results)
{
    let newresults = [];
    let seenseq = new Set();
    
    //console.log(results);
    for(let lookup of results)
    {
        let newlookup = [];
        //console.log(lookup);
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
    return add_epwing_info(newresults); // add epwing entries now
}

let last_lookup = "";
let last_time_lookup = Date.now();
function lookup_indirect(text, time, divexisted, alternatives_mode, strict_alternatives)
{
    if(text == "")
        return;
    //if(time < last_time_lookup+20) // reduces lag buildup
    //    return;
    if(text == last_lookup && divexisted)// || time < last_time_lookup+100)) // helps reduce double-lookups
        return "itsthesame";
    last_lookup = text;
    last_time_lookup = time;
    
    // try to look up successively shorter substrings of text
    // deconjugate() returns possible deconjugations, one of which has zero deconjugations, i.e. the plain text
    // build_lookup_comb looks for dictionary definitions matching any deconjugation, returning a list of them
    //console.log("trying to look up " + text);
    // FIXME: later lookups using definitions already caught
    if(alternatives_mode == 0 || alternatives_mode == 1 || alternatives_mode == 2)
    {
        let forms = deconjugate(text);
        let result = build_lookup_comb(forms);
        while(result === undefined && text.length > 0)
        {
            text = text.substring(0, text.length-1);
            //console.log("trying to look up " + text);
            forms = deconjugate(text);
            result = build_lookup_comb(forms);
        }
        if(result !== undefined && result.length > 0)
        {
            //console.log("found lookup");
            //console.log(text)
            result = sort_results(text, result);
            if(alternatives_mode == 0 || text.length <= 1)
                return skip_rereferenced_entries([{text:text, result:result}]);
            else if(alternatives_mode == 1) // second longest too 
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
                if(strict_alternatives && is_kana(short_text))
                    short_result = filter_kana_ish_results(short_result);
                if(short_result !== undefined && short_result.length > 0)
                {
                    short_result = sort_results(short_text, short_result);
                    return skip_rereferenced_entries([{text:text, result:result}, {text:short_text, result:short_result}]);
                }
                else
                    return skip_rereferenced_entries([{text:text, result:result}]);
            }
            else if(alternatives_mode == 2) // shortest too
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
                if(strict_alternatives && is_kana(short_text))
                    short_result = filter_kana_ish_results(short_result);
                if(short_result !== undefined && short_result.length > 0)
                {
                    short_result = sort_results(short_text, short_result);
                    return skip_rereferenced_entries([{text:text, result:result}, {text:short_text, result:short_result}]);
                }
                else
                    return skip_rereferenced_entries([{text:text, result:result}]);
            }
        }
    }
    else if(alternatives_mode == 3)
    {
        let results = [];
        let first = true;
        while(text.length > 0)
        {
            let forms = deconjugate(text);
            let result = build_lookup_comb(forms);
            
            if(!first && strict_alternatives && is_kana(text))
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
        //console.log(results);
        if(results.length > 0)
            return skip_rereferenced_entries(results);
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
            type:"popup"
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

//console.log("setting message listener");
browser.runtime.onMessage.addListener((req, sender, sendResponse) =>
{
    //console.log("received message to background script");
    if (req.type == "search")
    {
        sendResponse(lookup_indirect(req.text, req.time, req.divexisted, req.alternatives_mode, req.strict_alternatives));
    }
    else if (req.type == "platform")
    {
        sendResponse(platform);
    }
    else if (req.type == "fixicon")
    {
        fixicon();
    }
    else if (req.type == "gimmetext")
    {
        clipboard_hook(sender.tab);
    }
    else if (req.type == "refreshepwing")
    {
        refresh_epwing();
    }
    else
    {
        return;
    }
});
//console.log("set message listener");

browser.contextMenus.create({
    id: "nazeka-toggle",
    title: "Toggle Nazeka",
    contexts: ["page", "selection"],
    documentUrlPatterns: ["moz-extension://*/reader.html"],
    onclick: toggle_enabled
});
