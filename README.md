Compiler will read all files in `bots` folder and compile corresponding files in `temp` folder. What we try to
 achieve with this setup:
 1. Usability of commonly shared functions without copypasting (mainly to avoid accidental branching of copypasted
  code). During compilation we automatically copypaste everything from `common` folder into output bot files.
  2. Minification (for now, just strip comments out of everything). Output files have to stay below 16500 characters.