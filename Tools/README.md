# Extra goodies!

The tools in this directory are used to convert the LSL2 Keywords Database into a format that Nova understands.

## Disclaimers: READ THIS FIRST!

**WARNING!** Here Be Dragons!

The instructions below are _only_ meant for those willing to contribute their own work to this extension, and thus not minding to tinker a bit with their Macs. They're _not_ meant to be followed by anyone unfamiliar with software development on macOS, or not familiar with developing Nova extensions. If you absolutely need to have the syntax completions for the latest and greatest LSL functions which have come out just _today_, well, I'd definitely recommend you to wait a bit, or pester me to release a new version of this extension instead.

If you know what you're doing — by all means, go ahead, and blow up your finely-tuned environment!

If not... well, you've been warned. Just stay away from these instructions, and wait for a subsequent release of this extension. That's _much_ safer...

Also, I cannot guarantee that I'll be keeping these tools up-to-date; I might abandon them altogether and stop freely distributing them with this extension. I reserve the right to do so without prior notice.

You have been warned.

## Introduction

Since I've 'discovered' Sei Lisa and Mako Nozaki's most excellent LSL2/OSSL/AA Keywords Database and Derived Files Generator, which is at the basis of almost all contemporary syntax highlighters because it is very comprehensive and has been continuously updated over the years, it seemed rather stupid to manually 'duplicate' their work (they use similar resources/references), especially when I'm quite sure that I won't be able to keep up with them. As a consequence, it would be a pity if LSL support on Nova lagged behind what other editors (especially free and open-source ones!) were [already offering](https://github.com/buildersbrewery/linden-scripting-language).

Therefore, after much research (well, for me, at least), I decided to at least partially automate the process of keeping things up-to-date with the least effort, and write a small tool that converts the KWDB XML into Nova's auto-completions XML.

In reality, there are lots of tools doing the same for several other editors (many come from [the official KWDB repository](https://github.com/Sei-Lisa/kwdb) itself). Most are written in Python and/or Perl — two programming languages that I'm not really familiar with — so I decided to do it in [Go](https://golang.org), since it's a programming language I personall love. Allegedly, Go's performance in parsing XML is mediocre, but my other alternative — using PHP — was at least as bad, so, well, if you wish to tinker with the code, it's in Go...

I'm considering a way to _automatically_ download the LSL2 Keywords Database every time it gets updated, running the conversion utility on it, and producing the set of files required by Nova to deal with auto-completion and tooltips. That would make this extension permanently in sync with Lisa & Nozaki's work. However, at this stage, my Nova extension development skills are not sufficient to write that code, so, for now, everything is still done manually.

[@buildersbrewery](https://github.com/buildersbrewery/linden-scripting-language) suggested to add an automation workflow on GitHub to do exactly that, but I'm afraid I'm not knowledgeable enough to do with that automatically (especially because the last step — pushing it to Nova's repository — would always have to be made manually...)

## Installing Go

All you need to do is to use [Homebrew](https://brew.sh) and type `brew install go`. It will set everything up beautifully and you'll be ready to go (pun definitely intended!) with the latest version.

If by some reason you hate Homebrew, you can always install it directly from Google's own Go site; just [download the latest package](https://go.dev/dl/) and install it like any other application; a pre-compiled Apple Silicon version is also available. There _might_ be some additional tinkering required to get everything working (although I think that, these days, nothing else is necessary).

## Downloading the keyword database

Once you're sure you've got a working Go environment, use your favourite console tool (it can be even inside Nova, of course...) and go to the `/References` subdirectory (the original extension will very likely be installed under `~/Library/Application Support/Nova/Extensions/gwynethllewelyn.LindenScriptingLanguage`; ideally, however, you should be working on [your own GitHub fork](https://github.com/GwynethLlewelyn/LSL.novaextension) on a completely separate directory, say, under `~/Developer`).

Here you'll find a file named `kwdb.xml`. To get the latest version of that file, you can grab it from its [official repository on GitHub](https://raw.githubusercontent.com/Sei-Lisa/kwdb/master/database/kwdb.xml) and place it on that directory (just overwrite it).

## Compiling and running the tool

Then change the directory to `/Tools` (where this README is located) and just compile the converter:

`go build -o kwdbxmlconvert`

and to run it from the command line, it's as easy as typing:

`./kwdbxmlconvert`

If all goes well, you should get XML on the output. This is for the _completions_ XML file _only_ — therefore, you need to pipe the output to `/Completions/Linden Scripting Language.xml`.

You can run `./kwdbxmlconvert --help` to see some more options. In particular, at the time of writing, `kwdbxmlconvert` can _optionally_ also generate a few XML tags for the _syntax_ configuration file (by default, it generates a complete _auto-completions_ file, including tooltips); however, you will need to manually copy & paste the output for the _syntax_ to the required section(s); the process is not automated yet, mostly because the syntax file is considerably more complex as well as having most of the built-in functions and constants properly classified according to their (many) subtypes — the KWDB doesn't do that, except for (sometimes) tagging grid-specific versions (i.e. available on SL, OpenSimulator and/or Aurora Sim). This tagging is quite inconsistent.

There are also some weird duplications (or at least my simplistic coding finds a few duplicates here and there) and the overall KWDB is _not_ ordered; such ordering, where appropriate, was done manually. All this is _not_ automated, so consider the existing code as a work in progress.

Anyway... after you have copied the files to their proper places, go back to Nova and uncheck, then re-check this extension — it should reload the new completions file (which also includes descriptions/tooltips). If not, well, try to restart Nova. If not even that works, it means that my own code is unable to parse the latest version of the LSL2 Keyword Database. That's a bummer! Sorry, you'll have to deinstall this extension, and re-install it again, thus restoring the original files... and losing all your own work, unless you remembered to back it up!