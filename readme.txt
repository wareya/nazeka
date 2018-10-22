Nazeka is a rikai replacement.

*Nazeka is not ready for general use yet; it does not yet have all the necessary behaviors that rikai variants have.*

This is my first nontrivial javascript work and the code is probably terrible.

Options:

- Enabled: whether to search pages for text
- Compact: definitions on same line or with linebreaks
- Show original text: shows the string of text that nazeka used to look up a set of definitions
- Super border: add an additional level to the double border
- Fixed width: always use maximum width width, don't shrink to small contents
- Position as though fixed width: when rejecting the popup from the right side of the window, act as though it has the maximum width, even if it doesn't
- Search length: maximum length to search for words
- Matching mode: what kinds, of alternative lookups to display
- Strict matching for alternative matches: if true, alternative lookups of hiragana strings will not produce definitions that are not at least usually kana
- Lookup popup scale: zoom factor for entire popup
- Lookup popup width: maximum width for the lookup
- Lookup throttle: minimum milliseconds between the start of lookups
- Colors: the colors of the popup
- Font override: font override for the whole popup, max priority but will fall back to default fonts for characters not in the font override
- Font override (highlighted text only): for the main spelling of a definition

Nazeka has added more options since this was written.

Building:

Build process requires python and lxml, or an existing copy of the extension to rip JMdict#.json from.

- Download JMdict.gz from http://www.edrdg.org/jmdict/edict_doc.html
- Convert it to json with https://gist.github.com/wareya/c2175520db5f1927e4f6ba839487dd8c
- Place under dict/ so that [...]/dict/JMdict.json exists in that location relative to [...]/manifest.json
- Package as an extension for your browser of choice, or load it as a temporary/indev extension using your browser's development tools

Copyright 2017~2018; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0
