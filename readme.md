Nazeka is a rikai replacement.

***Nazeka is not ready for general use yet; it does not yet have all the necessary behaviors that rikai variants have.***

My code here is terrible, but at least we can all agree that Javascript is a terrible language.

# Options

Nazeka has added many options since it was first created, and they're documented within the options page. The following is an example of what options it has:

- Enabled: whether to search pages for text
- Compact: definitions on same line or with linebreaks
- Show original text: shows the string of text that nazeka used to look up a set of definitions
- Super border: add an additional level to the double border
- Fixed width: always use maximum width width, don't shrink to small contents
- Search length: maximum length to search for words
- Matching mode: what kinds of alternative lookups to display
- Strict matching for alternative matches: if true, ***alternative*** lookups of hiragana strings will not produce definitions that are not at least usually kana (the longest lookup will always show all possibilities)
- Lookup popup scale: zoom factor for entire popup
- Lookup popup width: maximum width for the lookup
- Lookup throttle: minimum milliseconds between the start of lookups
- Colors: the colors of the popup
- Font override: font override for the whole popup, max priority but will fall back to default fonts for characters not in the font override
- Font override (highlighted text only): for the main spelling of a definition

# Building

Build process requires python and lxml, or an existing copy of the extension to rip JMdict#.json from.

- Copy the appropriate manifest.json from etc/ (either etc/firefox/manifest.json or etc/chrome/manifest.json) into the root of the repository
- Download JMdict.gz from http://www.edrdg.org/jmdict/edict_doc.html
- Convert it to json with etc/process.py
- Move the output to under dict/ so that [...]/dict/JMdict1.json and others exist in that location relative to [...]/manifest.json
- Make sure every .json file is listed as available to the extension in manifest.json - if jmdict added a lot of words, there might be more than 11 files now
- Package as an extension for your browser of choice, or load it as a temporary/indev extension using your browser's development tools

# Copyright and License

Copyright 2017~2018; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0
