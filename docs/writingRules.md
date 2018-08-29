# Writing secret-shield rules

## Preprocess rules

All preprocess rules are executed from top to bottom. Preprocess rules are provided as an array with each element being:

```
{
  "type": "rule type",
  "name": "unique rule name",
  [other fields determined by rule type]
}
```

Preprocessing alters the string/line being processed in advance of running the main processing.

### Removal

Excludes matches from results.

* Each rule is of the type `remove` with the fields:

```
{
  "type": "remove",
  "name": "unique rule name",
  "pattern": "regular expression"
}
```

* Don't forget to escape backslashes

Removal rules are processed before the main search; matches are, for all intents and purposes, deleted from the string. Rules will subsequently NOT match across the deleted portion. For instance, if you remove `o` from the string `foobar` using `preprocess -> remove`, NONE of the following will match if you search for them: `foo`, `fbar`, `oba`.

Removal rules are processed in order, from top to bottom.

### Replacement

Replaces matches with other values.

* Each rule is of the type `replace` with the fields:

```
{
  "type": "remove",
  "name": "unique rule name",
  "pattern": "regular expression",
  "replace": "string to replace with"
}
```

Replace rules will replace matches with the specified string; search rules DO search in replacements. For instance, if you replace `r` with `z` using `preprocess -> replace`, searching for `bar` in `foobar` won't give any results, but searching for `baz` in `foobar` will find `baz`.

### Exclusion

Completely ignores a string if its length isn't between minLength and maxLength.

* Each rule is of the type `exclude` with the fields:

```
{
  "type": "exclude",
  "name": "unique rule name",
  "minLength": minimum length (optional),
  "maxLength": maximum length (optional),
  "disallowedString": see below (optional)
}
```
* If the string contains `disallowedString` defined in the rule, *this rule will not apply*
    * This is useful, for example, if you want to ignore very long strings that don't contain spaces.

### Bulk ignore

Completely ignores a string if it contains one of a given list of (**case-sensitive**) false positives.

* Each rule is of the type `bulkIgnore` with the fields:

```
{
  "type": "bulkIgnore",
  "name": "unique rule name",
  "path": "./path/to/json/file.json"
}
```
* Put the list of false positives in a json file that looks like this:

```json
["false positive 1", "false positive 2 1/2", "false positive 33 1/3"]
```
* A sample list is provided in `tables/falsepositives/falsePositives.json`.


## Main processing rules

### regex

Searches for regular expression matches.
* Add your rules under "regex" in the form of:

```
"unique rule name": {
  "pattern": "regex to search for"
  "minEntropy": optional, entropy value for filtering
}
```

* If `minEntropy` is present, matches will only count if their entropy is at least the minEntropy threshold. See [choosing entropy values](#choosing-entropy-values) for guidelines.
* Don't forget to escape backslashes!

### fuzzy

Performs fuzzy matching for phrases.
* Add your rules under "fuzzy" in the form of:

```
"unique rule name": {
  "phrases": [
    "array of phrases",
    "to search for"
  ],
  "threshold": fuzzy matching threshold
  "caseSensitive": whether matching is case sensitive. defaults to false.
}
```

* Threshold must be present. Quick guidelines:
    * 0-0.5: no match
    * 0.5-0.7: very distant match
    * 0.7-0.85: close match
    * 0.85-0.99: very close match
    * 1: identical match

### entropy

Searches for high-entropy strings, matching perfect randomness to a given percentile.
* Add your rules under "entropy" in the form of:

```
"unique rule name": {
  "percentile": percentile, see below,
  "minLength": minimum length of string,
  "maxLength": maximum length of string
}
```

* Percentile *is a string* and can have any of the following values: 95, 99, 99.5, 99.9, 99.95. The entropy rule will then use a lookup table automatically choose the correct entropy threshold for the given percentile. See [choosing entropy values](#choosing-entropy-values) for more details on how entropy matching works.
* `minLength` is the minimum length of the string being matched. It must be bigger than the values available in the lookup table, which is 16 in the default table.
* `maxLength` must be smaller than the values available in the lookup table, which is 256 in the default table.

## Postprocessing rules

All postprocess rules are executed from top to bottom. Like preprocess, postprocess rules are provided as an array with each element being:

```
{
  "type": "rule type",
  "name": "unique rule name",
  [other fields determined by rule type]
}
```

### ignoring findings

Completely ignores findings that have matched a certain rule name.
* Add your rules under "postprocess" in the form of:
```
{
  "type": "ignoreFinding",
  "name": "unique rule name",
  "finding": rule name of finding to ignore
}
```

When to use this rule? For example, if a string/line in a file matches both "Short high-entropy string" and "AWS Client ID" and it is set to ignore "AWS Client ID", it will completely ignore the entire string, unlike using a preprocessing rule or deleting the main processing rule. Check exlucions for more details.

# Advanced rule writing

## metadata keys

The `_info` metadata key has fields useful for automated reporting and version control and should be provided within the JSON file. Available options:
  * `ruleset`: short name for your rules (e.g. "minimal", "C++")
  * `version`: acts as a ruleset version number; any string you like, but it's recommended to be unique
  * `date`: date the version was written; should be `YYYY-MM-DD`
  * `org`: organization name
  * `author`: author of rules (optional)
  * `description`: a human-readable description of what the rules do

You can also include `_user` where you can specify whatever fields you want.

## Special rules

These rules are located in `special` have to do with file handling or other specialized functionality.

### Excluding files

`special` -> `IgnoreFiles` provides an array of file name regular expressions that will be ignored.

### CloudFormation Template parameters

Some cloudformation template parameters must be secure. This rule, `special` -> `CFTemplateSecureParameters` is an array of cloudformation template parameter name regular expressions for which the parameters must be secure.

### File size Limit

`FileSizeRestrictionInMB`: Only analyze the files which have less than `FileSizeRestrictionInMB` MB file size.

### Number of lines Limit

`NumberOfLinesRestriction`: Only analyze the files which have less than `NumberOfLinesRestriction` lines.

### Githook number of changes per file limit

`GitHookNumberOfChangesRestriction`: Only analyze the files which have less than `GitHookNumberOfChangesRestriction` number of changes per file.

## Disabling a rule

If you want to disable a rule but keep it in your rules JSON, you can add the property `"disabled": true` and secret-shield will not execute that rule.

## Exclusions

There are 3 ways to handle exclusions. Using a postprocessor to ignore the finding after the main rule is executed, using a preprocessor to alter the string before the main rule is executed, or using the disabled flag to stop the main rule from executing. Each option has slightly different effects:

| Option used to exclude: | postprocess `ignoreFinding` | preprocess `remove` | `"disabled": true` |
|---|---|---|---|
| Alters string before main processing? | no | yes | no |
| Rules A and B match in different parts of string, A is excluded | returns nothing | returns rule B | returns rule B |
| Same part of string matches A and B, A is excluded | returns nothing | returns nothing | returns rule B |

## Choosing entropy values

Certain regexes, such as `\b[0-9a-z]{40}\b` (which matches GitHub tokens) will inherently catch a lot of false positives (such as `helloworldhelloworldhelloworldhelloworld`). Using an entropy threshold takes advantage of the fact that keys and secrets appear completely random, while false positives such as sentences, long variable names, bits of URLs etc. are less random. Entropy is more or less a measure of the randomness of a string.

Because entropy is statistical in nature, there is no guarantee that a secret won't be missed because of setting an entropy threshold. If you don't set one, however, you might get flooded with false positives. Choosing a good entropy value is tricky. A good choice will remove most false positives while simultaneously catching almost all secrets. Choose too low and you might have too many false positives. Choose too high and the secret finder won't find some secrets.

### NEW! We now have a rule that automatically does all this for you!

[The new entropy rule](#entropy) will do this automatically for you. Just specify what percentage of the secrets you want to catch (see below) and you're good to go; it will automatically determine the string type (alphanumeric, hex, etc.) and choose the correct entropy threshold.

### If you want to do it manually, or as part of a regex rule:

We've included a utility to help you choose entropy values for the following scenario:
* Say you want to search for secrets that contain only the characters `0123456789ABCDEF`
* Those secrets are 40 characters long
* You've built a regex like `\b[0-9A-F]{40}\b` but when you run the string it finds things like `1234567890123456789012345678901234567890` which you obviously don't want.
* You figured that setting a minimum entropy value will be a good idea. But you don't want to guess.

`entropyVariance.js` to the rescue!

Simply go into the `utils` directory and run the following:

`node entropyVariance.js <character pool> <secret length> <runs>`

(the higher the number of runs, the more precise the results you'll get, but it'll take more time. 100000 is a good number).

In your case, it will be `node entropyVariance.js "0123456789ABCDEF" 40 100000`

This program will run a statistical analysis of random strings of the specified length and character pool and give you entropy ranges. This is what you'll get (values may vary slightly):

```
mean: 3.697
stdev: 0.108
0.05 min: 3.519 (catches 95% of secrets)
0.01 min: 3.446 (catches 99% of secrets)
0.005 min: 3.419 (catches 99.5% of secrets)
0.001 min: 3.363 (catches 99.9% of secrets)
0.0005 min: 3.341 (catches 99.95% of secrets)
```

If you're comfortable with stats, you're good to go. Otherwise, what this essentially does is give you the entropy threshold that you should set to catch that specific amount of secrets. For instance, if you want to catch 99.9% of secrets, simply set your `minEntropy` to `3.363`. If you're expecting many false positive strings to appear pretty random, or if you're getting too many false positives with a lower option, you might want to choose a higher entropy value (lower percentage). Otherwise, 99.9% is a reasonable value.

That's it!

## `rules.json` example:

Here's an example of a `rules.json` file containing all the currently supported rules:

```json
{
  "_info": {
    "ruleset": "example",
    "version": "0.0.1",
    "date": "2018-04-17",
    "author": "Jerry",
    "org": "SuperDuper Examples(tm)",
    "description": "General-purpose example rules"
  },
  "_user": {
    "I can specify": "whatever I want here",
    "fun": true
  },
  "special": {
    "CFTemplateSecureParameters": [
      "_KEY$",
      "(Secret|_SECRET)$",
      "Passwords?"
    ],
    "IgnoreFiles": [
      "\\/\\.git\\/",
      "\\/node_modules\\/",
      "\\.png$"
    ]
  },
  "preprocess": [
    {
      "type": "remove",
      "name": "Ignore URLs",
      "pattern": "(https?|ftp):\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,11}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)"
    },
    {
      "type": "bulkIgnore",
      "name": "Common false positives",
      "path": "./tables/falsepositives/falsePositives.json"
    },
    {
      "type": "exclude",
      "name": "Excludes strings shorter than 100 chars or longer than 200 chars that don't contain 'foo'",
      "minLength": 100,
      "maxLength": 200,
      "disallowedString": "foo"
    }
  ],
  "regex": {
    "AWS Client ID": {
      "pattern": "AKIA[0-9A-Z]{16}"
    },
    "High-entropy string": {
      "pattern": "\\w{40-128}",
      "minEntropy": 4.5
    }
  },
  "fuzzy": {
    "Don't commit message": {
      "phrases": [
        "don't commit",
        "remove before committing"
      ],
      "threshold": 85,
      "minLength": 30,
      "caseSensitive": false
    }
  },
  "entropy": {
    "High-entropy string": {
      "percentile": "99.9",
      "minLength": 32,
      "maxLength": 256
    }
  },
  "postprocess" : [
    {
      "type": "ignoreFinding",
      "name": "Ignore aws IDs",
      "finding": "AWS Client ID"
    }
  ]
}
```