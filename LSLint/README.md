# LSLint - The LSL Linter

LSL does not (yet) have a LSP, much less a compiler (outside of the Second Life Viewers, that is), but the closest we got is a _linter_, `lslint`, which actually works quite nicely, even catching common mistakes (such as declaring unused variables) that the built-in LSL Editor does not catch.

Kudos to the W-Hat team for releasing the code as free and open-source: https://github.com/Makopo/lslint

The binary should be compilable under pretty much anything that is POSIX compliant, but, unfortunately, my own outdated macOS Big Sur seems to have severe issues with bison/lex and it doesn't compile. The version copied here has been retrieved directly from the latest nightly build for macOS (Intel), so it might not work under ARM-based Macs.

To fully parse the latest LSL syntax, including the OpenSimulator and Aurora extensions, the linter requires a so-called `builtins.txt` file. If you grab it from GitHub, by default you just get the pre-generated version for plain vanilla LSL (i.e., no OSSL extensions). To generate your own version, you'll need to clone that repository, and then, under the `./lsl2dfg` directory, run:


```bash
python2.7 ./LSL2dfg.py -d ../database/kwdb.xml -f builtinstxt -y > /tmp/builtins.txt
```
(note that the tool is supposed to run under Python 3.2 as well, but, these days, we all have more current versions of Python, so it's safer to launch 2.7 instead).

The `builtins.txt` file thus generated needs to get the first line (a comment) removed, or else `lslint` will choke on it. By default, it should be on the following directory: 

`~/Library/Application\ Support/Nova/Extensions/gwynethllewelyn.LindenScriptingLanguage/LSLint/`

To run it directly from the shell, you'll therefore need to pass that path to `lslint`, such as:

```bash
lslint -d /path/to/builtins.txt my.script.lsl
```

See also `lslint -h` for the rest of the options.

## To-do roadmap

1. Add an extra menu option, to run the LSL linter on the current document, and display the results on a console. This is supposed to be easy enough, it's just a question of adding a few lines to `main-js`.
2. Fully integrate `lalint` into Nova "as if" it were an LSP. This is not quite the case, but Nova can be sort of tricked in producing similar results (i.e., flagging where errors occurred and _what_ these errors were!).
3. Automate the whole process of re-generating the `builtins.txt` file whenever Linden Lab updates their viewer with further functions (and/or when KWDB releases a new database version).