# Felin as a Service

![Sleeping librarian](public/librarian.gif)

## Features

### Generate personal names
* `/namegen` returns one random personal name in a list.
* `/namegen/table` returns the same in a table.
* `/namegen/json` returns the same in a JSON data structure.
* You can specify a gender with the `male` and `female` parameters. This surpresses the gender icons in list and table mode.
* You can specify an amount with the `amount` parameter.
* You can specify a randomizer seed with the `seed` parameter.
* All of this can of course be combined: `/namegen/table?amount=20&seed=42`.

### Generate place names
* `/placegen` returns one random place name, in English and Felinese, in a list.
* `/placegen/table` returns the same in a table.
* `/placegen/json` returns the same in a JSON data structure.
* Like with personal names, you can specify an amount and seed with the `amount` and `seed` parameters.
* All of this can of course be combined: `/placegen/table?amount=20&seed=42`.

### Generate character descriptions
* The character description generator works just like the name generator, except `/chargen`'s list output is prosaic and `/chargen/table` always includes gender icons.
* Characters can be claimed via the Firrhna Project and bcord Discord servers. You can list all claims for a given user with the `claimant` parameter.

### Dictionary lookup
* `/dict` returns a list of initial letters.
* `/dict?letter=[L]` returns a list of all words starting with that letter.
* `/dict/[word]` returns a list of all matching entries, including felin script, IPA pronunciation, and verb conjugations.
* `/dict/json?letter=[L]` returns a word list in raw JSON.
* `/dict/[word]/json` returns all information on matching entries in JSON.
* `/dict/eng/[word]` and `/dict/eng/[word]/json` work the same but look up the english word.

### Number lookup
* `/number/[num]` returns a table with the given number in hexadecimal and translated, including felin script and IPA pronunciation.
* `/number/[num]/json` returns the same information in JSON.
* Also try `/number/0x[num-in-hex]`.

## More resources
* [The Firrhna Project Wiki](https://firrhna-project.fandom.com/)
* [Felinese on ConWorkshop](https://www.conworkshop.com/view_language.php?l=FEL)


Felin as a Service is a Firrhna Production, © 2022. It is designed and implemented by [Kawa](https://helmet.kafuka.org/logopending), using [NodeJS](https://nodejs.dev/), [Express](https://expressjs.com/), [Aseprite](http://aseprite.org/), [FontForge](https://fontforge.org/), and [TextPad](https://textpad.com/).
