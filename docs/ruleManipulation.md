# Rule manipulation

## Providing your own rules

You can simply call `secret-shield` with `--config path/to/rules.json` to load rules from your own configuration file instead of the default one.

You can [learn how to write your own rules here](writingRules.md).

## Changing the default rules

The default rules governing the search are located in `config/defaultRules` and are, by default, `minimal`. You can change the ruleset and that will change the default rules used by secret-shield, including the pre-commit hook rules.

Note: `config/defaultRules` **must** correctly resolve to a rule file in `config/rules/`, and must be a single line only. For example, to select a minimal ruleset, the entire file `config/defaultRules` will be (with no empty line):

```
minimal
```

## Alternate ruleset

Some alternate rulesets are provided and can be used with the `<--config|-C> <ruleset>`.

| ruleset | description |
| --- | --- |
| `minimal` (default) | a minimal set of rules that has virtually no false positives. |
| `deep` | a ruleset that gives some false positives but finds more secrets. |
| `verydeep` | provides additional rules that can be noisy (many false positives) but searches even more deeply. |

You can add your own rulesets to `./config/rules/` and then you can call them directly without having to specify the path to the rule JSON. For example, `--config deep` will automatically load the `deep.json` file.

## Enabling and disabling rules on the fly

When manually searching, you can call `secret-shield` with `--enable [rules]` or `--disable [rules]` (alternatively `-y` and `-n`) to temporarily enable or disable those rules (if they're already defined in the configuration file). For example:

```
secret-shield --disable "High-entropy string" "AWS Client ID" --enable "Don't commit message" --repo myrepository
```

If these options are not given, the rules are left at their default state (usually enabled, but there's the occasional rule that's disabled by default).