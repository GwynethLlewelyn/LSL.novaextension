
![LSL syntax highlighting for the Nova editor](https://github.com/GwynethLlewelyn/LSL.novaextension/blob/main/Images/extension/Nova-LSL-logo.png?raw=true)

# Linden Scripting Language (LSL) Nova extension

A Nova extension providing syntax highlighting for Linden Scripting Language (LSL), the scripting language used in the Second Life® and OpenSimulator virtual world platforms.

Based on the amazing work providing (version 0.0.20210612000)

## Language Support

### This extension currently supports the following features of Linden Scripting Language:

- Syntax Highlighting for the latest version of LSL (as of the time of releasing this extension)
- Auto-completions for major LSL constructions and functions (as far as I could make them work)
- OpenSimulator & Aurora Sim LSL functions/constants

### Not done yet:

- Adding tooltips and parameter completion for _all_ functions
- Distinguishing global from local scopes for variables. This shouldn't be too hard, since LSL is rather rigid with declarations, but I haven't done it yet.

## Disclaimers, Acknowledgements & Warnings

Like many other LSL syntax highlighters, this extension now uses the most excellent work done by Sei Lisa and Mako Nozaki
on the LSL2/OSSL/AA Keywords Database and Derived Files Generator (also known as [KWDB](https://github.com/Sei-Lisa/kwdb)),
providing a complete LSL2 Keywords Database for Second Life®, OpenSimulator, and AuroraSim.

While not affiliated with Linden Lab, the developers of *KWDB* have collected information from a lot of different sources
and attempt to maintain a list of keywords as current as possible. They also provide a few conversion utilities to
transform the `kwdb.xml` database into several popular syntax highlighting schemes.

But please note that LSL is a language in perpetual flux, with Linden Lab (and the OpenSimulator core developer team!)
constantly adding new features and functionality, and sometimes making older versions obsolete, shuffling parameters
around, etc. so at some point in time this extension will be inevitably out of sync, until I figure out a way
to automatically parse the XML from the KWDB from within this Nova extension...

While this extension is _mostly_ working, and should give you adequate syntax colouring (and even reasonable scoping),
don't expect the results to be _exactly_ the same as inside the viewer's editor. In particular, the colours will match
your Nova theme, not the conventions set by Linden Lab. It's theoretically possible to create a new, specific theme to deal
with the LL colour conventions, but I haven't done that yet (I'm not expecting many people to use _this_ extension!).

## Legal Acknowledgements

Second Life®, Linden Scripting Language and the inSL logo are trademarks of Linden Research, Inc. No infringement is intended.

Nova® and the Nova logo are registered trademarks of Panic Inc.

The KWDB (a.k.a. LSL2/OSSL/AA Keywords Database and Derived Files Generator) is copyrighted by Sei Lisa and Mako Nozaki
and released under a [GNU Lesser General Public License 3](http://www.gnu.org/licenses/lgpl-3.0.html),
with parts also copyrighted by Linden Lab and released under the same license.

Gwyneth Llewelyn is not affiliated with either of these companies or organisations, much less endorsed by any of them.