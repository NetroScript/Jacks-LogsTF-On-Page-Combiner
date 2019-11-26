# Jacks logs.tf on-page combiner

This is a userscript (more or less a type of web extension) which allows you to combine logs on logs.tf without using any additional software. You just go to any page with logs and select the logs you want to combine and then let the script do the rest for you. You need to be logged in at least once or set a custom working API key.

The script should explain itself, but you additionally have a settings menu when you click the Jacks Log Combiner link on the right bottom of the page.

## Installation

Use an extension which can execute userscripts (F.e. [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) for [Chrome](https://www.google.com/chrome/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)  for [Firefox](https://www.mozilla.org/firefox))
and then install using this link: [Jacks-LogsTF-On-Page-Combiner.user.js](https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/raw/master/Jacks-LogsTF-On-Page-Combiner.user.js).

(Or paste / install it manually for your plugin, also works as just the JS file as long as you load the dependencies. So you can just append the dependencies and this to the head and it should work.)

## About

I previously wrote another log combiner, which was based on python [here](https://github.com/NetroScript/Jacks-TF2LogCombiner), but some friends complained about the usability of it (not being used to f.e. the command line). And they told me the other web version log combiner (from Sharky) doesn't work / exist anymore.

So I took my time to write a new, user friendly, web one, based on my python version.

Compared to (my and) other log combiners it should have some key advantages:

* No configuration or setup (it works directly on the logs.tf website, no need to get Python or Java or a .exe version)
* It tries to optimize log size (by removing unnecessairy lines)
* It automatically tries to suggest a map name (so you just have to enter the title)
* You don't need to copy and paste log ids but can just click them

## Changelog

### 0.1.8

* Changed
  * This script is now independent of functions of the userscript manager, for more info take a look at [issue #1](https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/issues/1) - but for the normal user nothing of interest changed.

### 0.1.7

* Improved
  * Correctly get the map name now for a map like `cp_granary_pro_rc8`

### 0.1.6

* Improved
  * Further log minifying was replaced with an "advanced" algorithm which allows the accuracy stat to survive but still greatly minifies the log, it is now enabled by default - Be aware you lose up to 1% accuracy with every log added due to potential rounding errors
  * Now using a TamperMonkey function instead of the default window.open to prevent the pop up blocker from blocking openening the newly created log
  * Error messages are now more clear (it will tell you if the log was too big and tell you the error status code on http errors)
  * Formatting

### 0.1.5

* Improved
  * You can now click the link in the footer to open a settings menu, there you can set a custom API key (which is not your own) and enable or disable further log minifying (which is disabled by default now) If you further minify the log you lose the accuracy stat

### 0.1.4

* Improved
  * If the user never generated a API key yet, the script will automatically generate on for him. (Also gets a key if it was previously wrong)

Notice:
    Additionally the namespace changed here, so you have to reinstall the script and remove the old version

### 0.1.3

* Improved
  * If you are logged in at least once, the userscript will save your API key, if the script has an API key but no user is logged in, it will use the key instead for uploading. Like before if there is no user logged in or no API key most of the functionality will be hidden

* Fixed
  * A bug which made logs unreadable for the log parser (by adding an unwanted undefined)

### 0.1.2

* Improved
  * You can now also add and remove logs directly on the log page (instead of only in the overview list)
  * Logs on the uploads page are now correctly handled (for whatever reason you would combine logs from there)

### 0.1.1

* Improved
  * Prevent pressing the Upload button multiple times

### 0.1.0

* Released

## Preview

![Preview](https://i.imgur.com/PvbewME.png)

Also [here](https://streamable.com/a1b8v) a video of it in action.
