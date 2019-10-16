# Jacks logs.tf on-page combiner
_____________________________________________
This is a userscript (more or less a type of web extension) which allows you to combine logs on logs.tf without using any additional software. You just go to your profile page and select the logs you want to combine (when logged in) and then let the script do the rest for you.


## Installation
_____________________________________________
Use an extension which can execute userscripts (F.e. [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) for [Chrome](https://www.google.com/chrome/) or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/)  for [Firefox](https://www.mozilla.org/firefox))
and then install using this link: [Jacks-LogsTF-On-Page-Combiner.user.js](https://github.com/NetroScript/Jacks-LogsTF-On-Page-Combiner/raw/master/Jacks-LogsTF-On-Page-Combiner.user.js).

(Or paste / install it manually for your plugin)

## About
_____________________________________________

I previously wrote another log combiner, which was based on python [here](https://github.com/NetroScript/Jacks-TF2LogCombiner), but some friends complained about the usability of it (not being used to f.e. the command line). And they told me the other web version log combiner (from Sharky) doesn't work / exist anymore.

So I took my time to write a new, user friendly, web one, based on my python version.

Compared to (my and) other log combiners it should have some key advantages:
* No configuration or setup (it works directly on the logs.tf website, no need to get Python or Java or a .exe version)
* It tries to optimize log size (by removing unnecessairy lines)
* It automatically tries to suggest a map name (so you just have to enter the title)
* You don't need to copy and paste log ids but can just click them


## Changelog
_____________________________________________

### 0.1.1

* Improved
    * Prevent pressing the Upload button multiple times

### 0.1.0

* Released


## Preview
_____________________________________________

![Preview](https://i.imgur.com/PvbewME.png)

Also [here](https://streamable.com/a1b8v) a video of it in action.