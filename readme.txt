nazeka is a rikai replacement written from scratch

*nazeka is not ready for general use yet; it does not yet have all the necessary behaviors that rikai variants have. it doesn't even have an "off" button.*

Building:

Build process requires python and lxml, or an existing copy of the extension to rip JMdict.json from.

- Download JMdict.gz from http://www.edrdg.org/jmdict/edict_doc.html
- Convert it to json with https://gist.github.com/wareya/c2175520db5f1927e4f6ba839487dd8c
- Place under dict/ so that [...]/dict/JMdict.json exists in that location relative to [...]/manifest.json
- Package as an extension for your browser of choice, or load it as a temporary/indev extension using your browser's development tools
