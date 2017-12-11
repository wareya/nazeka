Nazeka is a rikai replacement.

*Nazeka is not ready for general use yet; it does not yet have all the necessary behaviors that rikai variants have, and hasn't been tested enough to identify performance problems.*

This is my first nontrivial javascript work and there are probably a lot of obvious peeves to have with the code.

Building:

Build process requires python and lxml, or an existing copy of the extension to rip JMdict.json from.

- Download JMdict.gz from http://www.edrdg.org/jmdict/edict_doc.html
- Convert it to json with https://gist.github.com/wareya/c2175520db5f1927e4f6ba839487dd8c
- Place under dict/ so that [...]/dict/JMdict.json exists in that location relative to [...]/manifest.json
- Package as an extension for your browser of choice, or load it as a temporary/indev extension using your browser's development tools

Copyright 2017; Licensed under the Apache License, Version 2.0: https://www.apache.org/licenses/LICENSE-2.0
