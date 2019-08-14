# Non-obvious Nazeka Behaviors/Features

## Frequency information
The # is the rank (i.e. it is the Nth most common entry). The "ppm" is "parts per million"; how many apperances it has per million words.

## Multiple lookups?
By default, nazeka looks up as many lengths of text as possible and collects every single possible hit. This makes it so that if you mouse over 空気を読めない, it will find 空気を読めない, 空気を読む, 空気, and 空.

## The list of lookups is too long! I only want the top couple or maybe the top and the bottom!
You can configure this with the "Matching mode" setting. Longest only, longest and second longest, longest and shortest, or all (default).

## Can't I just select exactly how much I want to look up or something?
Why yes, yes you can! Just enable the "Use text selection to limit lookup length and force context" option.

## I don't want to do either of those, but the lookup list is too long! (Scrolling through lookups)
Ever have a tower of lookup results that goes off your screen and you can't see the bottom? Lift up your mouse and scroll down on the scrollwheel. The popup won't move or disappear. If this doesn't work (i.e. if the webpage has special javascript or CSS that breaks this method) then you can open up the mining UI with M (by default) and scroll down that instead.

## How am I supposed to scroll the sticky mode popup?
You don't. Well, you can. Just use the option that makes nazeka only perform lookups with the ctrl or shift key pressed. Otherwise, use the mining UI for scrolling instead.

## EPWING dictionaries
The JSON dictionary feature doubles as an EPWING dictionary feature. I can't help you acquire EPWING dictionary data. There are tools for converting the EPWING data to nazeka's JSON dictionary format on my github.

## Manual mining context
You can grab more than a single sentence for context when mining. This is done by selecting the chunk of text that you want nazeka to use for the context fields on your cards. This must be enabled in the options first. Options -> Behavior -> "Use text selection to limit lookup length and force context".

## Bilingual lookups in monolingual definitions
Nazeka supports the workflow of reading with only J-J definitions, then using both a J-E and J-J dictionary when looking up words in the J-J definitions, seamlessly. Set "Where to look for definitions" to "From json dictionary only" and enable "Force "From jmdict then json" definitions mode when mining UI is open". Now when you mouse over J-J definitions in the mining UI, J-E definitions will appear even if they're normally disabled outside of the mining UI. Note: Because JMDict actually has pretty good spellings/readings data, it's impossible to turn off JMDict readings.

## Two-column reader
If you enable "Force 'sticky' mode in reader" and set a large "Reader right padding" value, it will visually emulate a two-column reading application with text on the left and definitions on the right. You can combine this with a "Popup requires key" option to make ctrl or shift act like a lookup button, so mousing around the page normally doesn't reset the sticky definition window.

## Why doesn't nazeka have an option to select the text it looked up?
Because it causes lots and lots of subtle bugs and glitches, especially if the webpage you're on has javascript that reacts to text selections. It also conflicts with things like the context override feature described above. Use the highlighted context snippet in the top right of the lookup window instead. The span of text nazeka looked up is highlighted. (This context snippet can be turned off.)

## Do you have a kanji mode?
Yes. Press K. Note: composition data is based on a translingual chinese character data project, and compositions may not represent those described by formal Japanese kanji education resources. Readings are limited to joyo kanji. Stroke counts for non-joyo kanji are guesses.

## Why doesn't the kanji mode have meanings?
Read https://github.com/wareya/nazeka/issues/12#issuecomment-449662913 and https://forum.unseenjapan.com/t/nazeka-rikai-replacement-also-works-on-android-firefox/54/13?u=wareya - TLDR: there is no freely-distributable kanji dictionary that is not full of confusing or downright wrong "information", and even if there was, this behavior would be disabled by default to avoid encouraging absolute beginners to use kanji definitions as "word" definitions.

## Readings that are obviously wrong
Some JMdict entries, like the one for 昨夜, have multiple words in them. Why? I don't know. But it leads to things like having a spelling of 夕べ in the same entry as a reading of さくや. JMdict contains information that restricts which readings and spellings are associated with one another, but this is only used during the lookup process and during popup generation. It would look bloated to display it directly, or to list every possible spelling-reading pair.
