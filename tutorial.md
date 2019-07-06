Note: some aspects of this tutorial are a little out of date. Just browse through everything Nazeka makes available and play with it for now.

# Installation

Install from [Mozilla's official Firefox addons website](https://addons.mozilla.org/en-US/firefox/addon/nazeka/), or [assemble an addon package yourself (not recommended)](https://github.com/wareya/nazeka/blob/master/readme.md).

# Non-obvious Behavior

* The default hotkeys for sticky mode and kanji mode are B and K.
* The number keys (1 through 9) can play audio (during normal mouseovers) or mine specific words (when the mining UI is open).
* If you enable the "Use text selection to limit lookup length and force context" option, then the selected chunk of text will be used for the context sentence when mining, instead of the autodeteced sentence.
* There are several options for how the reader inserts text and functions in general.
* The frequency feature does not fall back to kanji-only or kana-only lookups.
  * It only finds exact matches. This means that if the frequency list disagrees with jmdict about how to spell a word, it won't find the frequency information for it.
* The convert-hiragana-and-katakana fallback only happens if there are no results for a given bit of text.
  * This means that mousing using over モノ doesn't bring up definitions for もの, because an entry for just plain モノ already exists. However, mousing over カタナ looks up かたな, because there's no entry associated with カタナ.

# General Use Advice

* Nazeka's default hotkeys are P (audio), K (kanji), M (mining), N (close), and B (sticky mode).
* You can play audio with "P" or the number keys (1-9) while the dictionary popup is open. This audio comes from languagepod101, and only works when you have an internet connection. You can also use the number keys for mining (more on that later).
* Nazeka is not a parser. It doesn't try to figure out where words *actually* end. It will try to find the longest possible dictionary word it can, even if it's not actually being used as a word by the text. You need to use your brain.
* Nazeka has a kanji lookup mode. This is mostly useful for checking joyo readings and kanji composition information.
* Nazeka supports automatic flashcard creation, called "Mining". Take it easy and don't mine tons of obscure stuff if you're still a beginner. It's always better to learn things that are more important to you right now than things that won't be important for many months.
* Nazeka supports auxiliary JSON dictionaries. These are NOT Yomichan dictionaries. Anyways, Nazeka's JSON dictionary support mostly piggybacks off of JMDict for deconjugation, so you don't have to worry about part-of-speech tagging at all. In fact, part-of-speech tags aren't supported. This feature can either be used with converted EPWING dictionaries or as a way of making story-specific name/jargon dictionaries.
* Nazeka lets you export/import complete backups of absolutely everything stored in its memory. I highly recommend that you back it up at least once a month or so, just in case something goes horribly wrong. You don't want to lose your custom names dictionaries for no good reason!
* Nazeka lets you override its internal deconjugation dataset. You can find the clean unaltered deconjugation dataset for modification in this git repository. If I abandon Nazeka before finishing writing all the deconjugations for basic word types (I don't even deconjugate する yet!) this will be the only way to improve it, but you probably don't have to worry about it.

# Settings

Nazeka has many settings, and many of them only need to be changed if you run into personal problems with part of Nazeka's behavior. These are the ones that you're most likely to change.

## Behavior

* Show original text
  * Nazeka uses selections for something else, so it doesn't highlight the bit of text it found with a selection. This is a replacement for that aspect of other mouseover dictionaries.
* Use text selection to limit lookup length and force context
  * If you enable this option, then if you mouse over text that's already selected, Nazeka will use exactly that selection as the context to find words from, so you can forcibly truncate it at word boundaries. Very useful if your "Matching mode" setting is not "All matches". It's also the exact context that gets stored with flashcards when mining, so you can also use this feature to avoid bad sentence boundary detection, so it's also useful if you're mining.
* Enable live mining
  * Enable if you want to mine cards straight to Anki. Must be configured to be used. Configured elsewhere.

## Display

* Fixed width
  * Off by default. Enable if you're annoyed by the occasional narrow mouseover window, or by the mouseover window flipping when it changes width near the edge of the screen

## Theme

* Background/foreground color:
  * Light-on-dark by deafult, mild contrast. Change to a higher contrast color pair if your monitor has poor contrast. Or change to a dark-on-light color pair if you use a dim screen in a bright environment (light-on-dark is better otherwise).
* Highlight/reading color
  * Change to something easier to differentiate if you're fully colorblind.
* Font overrides
  * Add your desired font or fonts. No trailing comma. They're prepended to the default font list.

# Using the reader/clipboard grabber

Right click Nazeka's toggle icon and select "Open Reader".

![image: context menu](https://i.imgur.com/0cBEbmn.png)

This page will watch the clipboard and copy the clipboard into itself if it contains Japanese text.

![image: reader](https://i.imgur.com/Grtm8Mp.png)

Nazeka can be toggled from this page by right clicking the page and selecting the right context menu option. If it doesn't appear, you have another addon interfering with Nazeka's operation. This toggle is not in the context menu on any other page.

# Mining

Nazeka supports both "storage" mining and "live" mining.

Storage mining stores cards in Nazeka itself, and you need to transfer them into a flashcard program manually.

Live mining communicates with Anikconnect while Anki is running so that cards are created without any interaction.

## Configuring live mining

If you want to use live mining, you need to install the Ankiconnect plugin for Anki, then configure live mining inside Nazeka. You can access the live mining configuration page either through the options menu or by right clicking Nazeka's toggle icon and selecting "Configure Live Mining".

## Mining in general

Press "m" while Nazeka's lookup popup is open to turn the popup into a mining UI. The mining UI moves to the top right corner of the screen.

![image: mining](https://i.imgur.com/z7Yjj1w.png)

From here you can press on highlighted spellings to mine the associated dictionary entry. You can also use the number keys to mine a specific dictionary entry.

It's highly recommended that you edit your cards manually to strip down excessively wordy definitions after/while mining.

## Storage mining

After clicking on the highlighted part of one of the entries, go back to a main browser window if you're in the Reader, then right click Nazeka's toggle icon again, and select "View Mined Cards".

![image: mined cards](https://i.imgur.com/bcERj3n.png)

This shows a text field listing all the cards you've mined with Nazeka. Pressing "Reset" will clear Nazeka's memory of **all** mined cards. Don't do it unless you need to.

Each line in this list is tab-separated-fields. Spelling, tab, reading, tab, definition, tab, JMDict ID. This list can be imported into Anki, but you need to make a compatible deck.

# JSON Dictionaries

Nazeka also supports custom dictionaries. This feature can be used to import covnerted EPWING dictionaries (see https://github.com/wareya/nazeka_epwing_converter ) or to make custom name/jargon dictionaries for specific stories you're going through right now.

The manager and editor are pretty self-explanatory, but if you want to edit dictionaries directly, you have to mind the syntax. Don't worry, it throws an error and doesn't do anything if you end up breaking the syntax, so you can always close and reopen it and try again.

![image: json dict manager](https://i.imgur.com/ZWOtw1O.png)
