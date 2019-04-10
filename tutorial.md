# Installation

Install from [Mozilla's official Firefox addons website](https://addons.mozilla.org/en-US/firefox/addon/nazeka/), or [assemble an addon package yourself](https://github.com/wareya/nazeka/blob/master/readme.txt).

# Settings

Nazeka has many settings, and many of them only need to be changed if you run into personal problems with part of Nazeka's behavior. These are the ones that you're most likely to change.

##Display

Fixed width: Off by default. Enable if you're annoyed by the occasional narrow mouseover window, or by the mouseover window flipping when it changes width near the edge of the screen

##Theme

Background/foreground color: Light-on-dark by deafult, mild contrast. Change to a higher contrast color pair if your monitor has poor contrast. Or change to a dark-on-light color pair if you use a dim screen in a bright environment (light-on-dark is better otherwise).

Highlight/reading color: Change to something easier to differentiate if you're fully colorblind.

Font overrides: Add your desired font or fonts. No trailing comma. They're prepended to the default font list.

## Behavior

Enable live mining: Enable if you want to mine cards straight to Anki. Must be configured to be used. Configured elsewhere.

# Using the reader/clipboard grabber

Right click Nazeka's toggle icon and select "Open Reader".

![image: context menu](https://i.imgur.com/nJe6HQr.png)

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

## Storage mining

After clicking on the highlighted part of one of the entries, go back to a main browser window if you're in the Reader, then right click Nazeka's toggle icon again, and select "View Mined Cards".

![image: mined cards](https://i.imgur.com/bcERj3n.png)

This shows a text field listing all the cards you've mined with Nazeka. Pressing "Reset" will clear Nazeka's memory of **all** mined cards. Don't do it unless you need to.

Each line in this list is tab-separated-fields. Spelling, tab, reading, tab, definition, tab, JMDict ID. This list can be imported into Anki, but you need to make a compatible deck.
