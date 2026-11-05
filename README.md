# back-in-20

Browser game: sit at a stranger's desk, guess their passwords one clue at a time, then learn how to defend against it.

*De retour dans 20 minutes* — Camille has just left her desk. You have 20 minutes to take over her digital life, then a debrief shows every mistake she made and how to avoid it. Everything (people, apps, brands) is fictional.

## Play locally

The game uses ES modules, so it needs a local server (opening `index.html` directly does not work):

```sh
npm start          # serves the folder, then open the URL it prints
npm test           # game logic and password analyzer tests
```

`index.html?seconds=10` shortens the round for testing.

Controls: mouse to inspect objects, keyboard to type codes, Enter to submit, Escape to put an object down.

## Layout

```
index.html        the 1600x900 stage, scaled to the window
css/              one file per part (desk, notebook, screens, overlay, phone)
js/main.js        startup, clock, keyboard
js/state.js       clues, unlocked devices, attempts (no DOM, tested)
js/timer.js       countdown (no DOM, tested)
js/notebook.js    the notebook
js/overlay.js     an object held in the foreground
js/scenes/        one module per scene or device
engine/           password analyzer copied from password-tool (see engine/README.md)
tests/
```

Vanilla HTML/CSS/JS, no dependencies, no build step: the folder is published as is on GitHub Pages and zipped for itch.io.

## Credits

- Password analyzer inspired by [zxcvbn](https://github.com/dropbox/zxcvbn) (MIT).
- [EFF large wordlist](https://www.eff.org/dice) (CC BY 3.0 US).

## License

MIT
