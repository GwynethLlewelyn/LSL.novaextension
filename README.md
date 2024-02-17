![LSL syntax highlighting for the Nova editor](https://github.com/GwynethLlewelyn/LSL.novaextension/blob/main/Images/extension/Nova-LSL-logo.png?raw=true)

# Linden Scripting Language (LSL) Nova extension

A Nova extension providing syntax highlighting for Linden Scripting Language (LSL), the scripting language used in the Second Life® and OpenSimulator virtual world platforms.

Based on the amazing work by Sei Lisa and Mako Nozaki, who compiled the [LSL2 Keywords Database](https://github.com/Sei-Lisa/kwdb) (version 0.0.20231219001), also known as KWDB, without which I would need to do everything manually (like I did for the first release!).

## Language Support

### This extension currently supports the following features of Linden Scripting Language:

-   Syntax Highlighting for the latest version of LSL (as of the current release of the KWDB)
-   Auto-completions for major LSL constructions, functions and constants (as far as I could make them work)
-   OpenSimulator & Aurora Sim LSL functions/constants (not all are correctly tagged, though)
-   Opening the LSL Portal on the Second Life Wiki for the object currently selected
-   Experimental (but mostly functional): LSlint (LSL linter) support, which will show syntax errors (like the built-in viewer, but better) and even some semantic analysis (redundant code, declared but unused elements, etc.) which the SL Viewer does _not_ include (!).
-	On Preferences you can set the location of the LSL linter, as well as of its definition table (`builtins.txt`). Defaults are the included versions in the extension itself.
-	Lots of (optional) debugging messages spamming on the console (which can be turned off).

### Not done yet:

-   Hovering tooltips. I haven't figured out how _that_ works _without_ using a Language Server Protocol application.
-   Distinguishing global from local scopes for variables. This shouldn't be too hard, since LSL is rather rigid with declarations, but I haven't done it yet.
-   Making the jumps to definition work consistently.
-   Getting the scope selections to work.
-   Automagically updating the syntax auto-completions every time Lisa & Nozaki update their own database (there are now a few tools to help with that).
-   Using Panic's new support for Tree-sitter grammars, which is even trickier to deal with (and requires some compilation) than the current language files...
-   Fully support the LSL linter from W-Hat, namely, by allowing more options to be checked/selected.
-	Fix `lslint` to support OSSL overloaded functions (ha!).
-   Investigate alternatives to `lslint` which are extensions/expansions and which also might make some things easier to catch.
-	Create a LSL LSP. (Hah!)

## Disclaimers, Acknowledgements & Warnings

Like many other LSL syntax highlighters, this extension now uses the most excellent work done by Sei Lisa and Mako Nozaki on the LSL2/OSSL/AA Keywords Database and Derived Files Generator (also known as [KWDB](https://github.com/Sei-Lisa/kwdb)), providing a complete LSL2 Keywords Database for Second Life®, OpenSimulator, and AuroraSim.

While not affiliated with Linden Lab, the developers of _KWDB_ have collected information from a lot of different sources and attempt to maintain a list of keywords as current as possible. They also provide a few conversion utilities to transform the `kwdb.xml` database into several popular syntax highlighting schemes.

But please note that LSL is a language in perpetual flux, with Linden Lab (and the OpenSimulator core developer team!) constantly adding new features and functionality, and sometimes making older versions obsolete, shuffling parameters around, etc. so at some point in time this extension will be inevitably out of sync, until I figure out a way to automatically parse the XML from the KWDB from within this Nova extension...

While this extension is _mostly_ working, and should give you adequate syntax colouring (and even reasonable scoping) don't expect the results to be _exactly_ the same as inside the viewer's editor. In particular, the colours will match your Nova theme, not the conventions set by Linden Lab. It's theoretically possible to create a new, specific theme to deal with the LL colour conventions, but I haven't done that yet (I'm not expecting many people to use _this_ extension!).

On the other hand, the inclusion of `lslint` (LSL Linter) allows Nova to go well beyond the Linden Lab's built-in code editor in the viewer.

Also thanks to other Nova extension developers (including, but not limited to, Genealabs) for writing good, clean, understandable code that I shamelessly copied and reused.

## Extra goodies!

Warning: for tinkerers, hackers, and hard-core Nova extension programmers only!

### KWDB Converter

I've used the directory `/Tools` to keep around a few tools used to extract information from the _KWDB_ and convert it into the XML that the Nova syntax extensions require. You're welcome to tinker with those, as well as submit push requests with your own contributions.

Although it's more conventional to do those tools in either Perl or Python, which are especially well-suited to the task of parsing XML quickly, or, alternatively, do them in JavaScript, so that they could be simply integrated into Nova, I'm not proficient enough in either of those, so I simply did it in Go. The directory also includes a [README.md](Tools/README.md) with some simple tips on how to properly compile those.

### LSL linter

We don't have a language server for LSL (yet!) but we have something reasonably similar: the [`lslint` project](https://github.com/Makopo/lslint/). If you don't want to compile it on your own, it's included under the `/LSLint` directory. You have to run it passing the `builtins.txt` file that has been pre-assembled with the latest & greatest LSL & OSSL definitions (also present in the very same directory is `builtins-only-lsl.txt` which limits linting 'official' LSL only, and not any of its dialects).

Kudos to the whole W-Hat team, which released the original lslinter code into the public domain, and special thanks to Makopo for being its current (main) maintainer, as well as Sei Lisa for the many corrections and improvements.

## Legal Acknowledgements

Second Life®, Linden Scripting Language and the inSL logo are trademarks of Linden Research, Inc. No infringement is intended.

Nova® and the Nova logo are registered trademarks of Panic Inc.

The KWDB (a.k.a. LSL2/OSSL/AA Keywords Database and Derived Files Generator) is copyrighted by Sei Lisa and Mako Nozaki and released under a [GNU Lesser General Public License 3](https://www.gnu.org/licenses/lgpl-3.0.html), with parts also copyrighted by Linden Lab and released under the same license.

LSLint is placed into the public domain.

Some of the test files under the `/Tests` directory have been shamelessly copied from the LSL Portal section of the [Second Life Wiki](http://wiki.secondlife.com/wiki/Category:LSL_Library), and, for the OpenSimulator dialect of LSL, from the [OpenSimulator Wiki](http://opensimulator.org/wiki/OSSL_Script_Library); their authors are credited on each of them.

Gwyneth Llewelyn is not affiliated with either of these companies or organisations, much less endorsed by any of them.

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=GwynethLlewelyn_LSL.novaextension&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=GwynethLlewelyn_LSL.novaextension)
