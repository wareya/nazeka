Nazeka is a rikai replacement.

Nazeka was the first nontrivial thing I wrote in Javascript. The code is terrible and a lot of it is bundled into a small number of files. I need help splitting it up into multiple files, or being told how to split it up into multiple first without requiring any build tools.

***Nazeka is ready for general testing; it's still missing a few behaviors from rikaisama, and it's still clunky, but it's close to complete.***

# Settings

See the [tutorial](https://github.com/wareya/nazeka/blob/master/tutorial.md#settings).

# Building

Build process requires python and lxml, or an existing copy of the extension to rip JMdict#.json from.

- Download JMdict.gz from http://www.edrdg.org/jmdict/edict_doc.html
- Convert it to json with etc/process.py
- Move the output to under dict/ so that [...]/dict/JMdict1.json and others exist in that location relative to [...]/manifest.json
- Make sure every .json file is listed as available to the extension in manifest.json - if jmdict added a lot of words, there might be more than 11 files now
- Package as an extension for your browser of choice, or load it as a temporary/indev extension using your browser's development tools

# Copyright and License

Copyright 2017~2019; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0
