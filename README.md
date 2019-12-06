**Bot Land is a competition where you code AI for bots that fight other peoples' bots. I participated in this
 competition and this repository contains all my code.**
 
 Here's a video showcasing gameplay with these bots: [https://youtu.be/M94WOJzoGR8](https://youtu.be/M94WOJzoGR8)

The `bots` folder contains code for individual bots, and `common` contains code
 that is shared by
 multiple bots. The
 most interesting stuff is `bots/tincan.js` (swarm unit), `bots/midrangerV2.js` (missile unit that does coordinated
  hit-and-runs) and everything in `common` folder. I held the #1 position on the attack ladder with these bots.
  
In order to use the bots you need to compile them. The compiler will read the designated
  file from `bots` folder and any imports from `common` folder, and output minified code. Minification is necessary
   because the game only accepts scripts below 16500 characters. Also, when you have many bots, you have a lot of
    shared functionality, and this setup facilitates sharing functions without copypasting code (without a setup
     like this you often end up with accidentally inconsistent branches of the same code running on different bots).

**Disclaimer:** Not everything works. Some stuff is WIP. Some stuff is quickly hacked together (e.g. the compiler) and
 will break for someone who uses slightly different syntax than me.