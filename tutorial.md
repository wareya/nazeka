# Installation

Install from [Mozilla's official Firefox addons website](https://addons.mozilla.org/en-US/firefox/addon/nazeka/), or [assemble an addon package yourself](https://github.com/wareya/nazeka/blob/master/readme.txt).

# Settings

It's recommended to mess with the settings before using Nazeka for too long. The default settings are one-size-fits-all, but not actually very good for extensive reading.

![image: settings 1](https://i.imgur.com/EACEcsQ.png)

Recommendation:

- Set "Matching mode" to "All matches". If that makes Nazeka find too many results, use "Longest and second longest" instead.
- Make sure "Strict matching for alternative matches" is enabled so that the results list doesn't get filled with useless entries when you mouse over kana.
- Increase lookup throttle to something high like 50 or 100 (measured in thousandths of a second) if you have a very weak computer or an android device.

![image: settings 2](https://i.imgur.com/TdpEqdB.png)

Recommendation:

- If the popup size is too small, increase "Lookup popup scale".
- The other defaults here are fine. You might want to enable "Fixed width" or "Position as though fixed width", or set "Popup positioning corner" to "Top right" if you read vertical text. The "bottom" positioning corners are inherently buggy because of limitations in how HTML and CSS define some overflow behavior stuff; they are only included for completeness.

![image: settings 3](https://i.imgur.com/BIT2o8Z.png)

Recommendation:

- Enable the "Super border" if you have vision problems.
- Change the colors as desired. The default colors are very good for people with normal monitors and acceptable vision, but some people might want to make it dark-on-light instead of light-on-dark, or change the highlighting color.
- If you use a different operating system than Windows, you might want to add font overrides.

# Using the reader/clipboard grabber

Right click Nazeka's toggle icon and select "Open Reader".

![image: context menu](https://i.imgur.com/nJe6HQr.png)

This page will watch the clipboard and copy the clipboard into itself if it contains Japanese text.

![image: reader](https://i.imgur.com/Grtm8Mp.png)

Nazeka can be toggled from this page by right clicking the page and selecting the right context menu option. If it doesn't appear, you have another addon interfering with Nazeka's operation. This toggle is not in the context menu on any other page.

# Mining

Nazeka's mining support is extremely primitive and inflexible, and requires lots of user interaction. That said, Nazeka *does* technically support mining.

Press "m" while Nazeka's lookup popup is open to turn the popup into a mining UI. The mining UI moves to the top right corner of the screen.

![image: mining](https://i.imgur.com/z7Yjj1w.png)

After clicking on the highlighted part of one of the entries, go back to a main browser window if you're in the Reader, then right click Nazeka's toggle icon again, and select "View Mined Cards".

![image: mined cards](https://i.imgur.com/bcERj3n.png)

This shows a text field listing all the cards you've mined with Nazeka. Pressing "Reset" will clear Nazeka's memory of **all** mined cards. Don't do it unless you need to.

Each line in this list is tab-separated-fields. Spelling, tab, reading, tab, definition, tab, JMDict ID. This list can be imported into Anki, but you need to make a compatible deck. Nazeka doesn't have a formatting system yet, but whenever I add support for including the sentence you mined, it'll use a formatting system.
