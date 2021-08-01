
![LSL syntax highlighting for the Nova editor](https://github.com/GwynethLlewelyn/LSL.novaextension/blob/main/Images/extension/Nova-LSL-logo.png?raw=true)

# Linden Scripting Language (LSL) Nova extension

A Nova extension providing syntax highlighting for Linden Scripting Language (LSL), the scripting language used in the Second Life® and OpenSimulator virtual world platforms.

## Language Support

This extension currently supports the following features of Linden Scripting Language:

- Syntax Highlighting for the latest version of LSL (as of the time of releasing this extension)
- Auto-completions for major LSL constructions and functions (as far as I could make them work)
- OpenSimulator LSL functions/constants

Still missing:

- Experiences
- EEP settings
- And probably a lot more that hasn't been updated to the SL Wiki yet...

Not done yet:

- Adding tooltips and parameter completion for _all_ functions (there are hundreds!)

Note that LSL is a language in perpetual flux, with Linden Lab constantly adding new features and functionality, and
sometimes making older versions obsolete, shuffling parameters around, etc. so at some point in time this extension will
be inevitably out of sync.

Most of the information was gathered from the official [LSL Portal of the Second Life Wiki](https://wiki.secondlife.com/wiki/LSL_Portal),
the official [OpenSimulator Wiki](http://opensimulator.org/wiki/), and from several files scattered around the
[Firestorm Viewer](https://www.firestormviewer.org/) application (which provides a wealth of information for
auto-completion and tooltips).

While this extension is mostly working, and should give you adequate syntax colouring (and even reasonable scoping),
don't expect the results to be _exactly_ the same as inside the viewer's editor. In particular, the colours will match
your Nova theme, not the conventions set by Linden Lab. It's theoretically possible to create a new, specific theme to deal
with the LL colour conventions, but I haven't done that yet (I'm not expecting many people to use _this_ extension!).

## Disclaimer

Second Life®, Linden Scripting Language and the inSL logo are trademarks of Linden Research, Inc. No infringement is intended.

Nova® is a registered trademark of Panic Inc.

Gwyneth Llewelyn is not affiliated with either of these two companies, much less endorsed by any of them.