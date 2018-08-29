# Output manipulation

## Redacting secrets

If you do not wish to log potentially sensitive results to the console, you can redact the results with `--redact [number]` (`-R [number]`) to only display the first `number` characters of each string. If `number` isn't provided, it'll obfuscate the whole thing. If `number` is negative, it'll display all but the last `number` characters. For example:

```
arya@elfbox:~/temporary$ secret-shield -f test

  ┌───────────────────────────┬─────────────────────────────────────┬───────────────────────────┐
  │           file            │               string                │          finding          │
  ├───────────────────────────┼─────────────────────────────────────┼───────────────────────────┤
  │           test            │         qwereytiukjmnvbdfwe         │ Short high-entropy string │
  └───────────────────────────┴─────────────────────────────────────┴───────────────────────────┘
arya@elfbox:~/temporary$ secret-shield -f test -R 5

  ┌───────────────────────────┬─────────────────────────────────────┬───────────────────────────┐
  │           file            │               string                │          finding          │
  ├───────────────────────────┼─────────────────────────────────────┼───────────────────────────┤
  │           test            │           qwere[REDACTED]           │ Short high-entropy string │
  └───────────────────────────┴─────────────────────────────────────┴───────────────────────────┘
```

## JSON output

If JSON output is required, the option `-o json` or `-o json-blob` can be provided.

For regular JSON output (`-o json`), each result is its own separate JSON on a separate line, as a JSON object with the following structure:
```
{
  "result": {
    "file": "path/to/file.js",
    "string": "string with the secret",
    "finding": [
      "array",
      "of",
      "findings"
    ]
  },
  "meta": {
    "rules_info": the content of the "_info" field in the rules json,
    "rules_user": the content of the "_user" field in the rules json,
    "date": the date and time secret-shield was run
  }
}
```

For a JSON blob output (`-o json-blob`) results are provided as a single JSON blob on a single line:
```
{
  "results": [
    {
      "file": "path/to/file.js",
      "string": "string with the secret",
      "finding": [
        "array",
        "of",
        "findings"
      ]
    },
    more results here
  ],
  "meta": {
    "rules_info": the content of the "_info" field in the rules json,
    "rules_user": the content of the "_user" field in the rules json,
    "date": the date and time secret-shield was run
  }
}
```
