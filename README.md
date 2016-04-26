# yowl-dialog-manager

Multi-interaction dialog management for yowl

## Install

```bash
$ npm install yowl-dialog-manager --save
```

Dialog Manager also requires a persistent yowl context to handle dialog chaining and responses.

[yowl-context-memory](https://github.com/brianbrunner/yowl-context-memory)
[yowl-context-rethink](https://github.com/brianbrunner/yowl-context-rethink)

## Example

```js
var yowl = require('yowl');
var bot = yowl();

bot.name = "Dialog Bot";

var local = require('yowl-platform-cli');
bot.extend(local);

var memory = require('yowl-context-memory');
bot.use(memory);

var DialogManager = require('yowl-dialog-manager')();

DialogManager.add('greet', {
  test: function(context, event) {
    return !context.greeted;
  },
  messages: [
    "Hello there!",
    "This an example of a multi-step dialog.",
    "As a note, chaining dialogs between multiple interactions requires a persisted context.",
    "This dialog is an overly complicated echo example."
  ],
  after: function(context, event, callback) {
    context.greeted = true;
    DialogManager.dialogs.step_1.play(context, event, callback);
  }
});

DialogManager.add('step_1', {
  messages: [
    "What is the message that you'd like me to echo back?"
  ],
  onresponse: function(context, event, callback) {
    context.echo = event.message;
    DialogManager.dialogs.step_2.play(context, event, callback);
  }
});

DialogManager.add('step_2', {
  messages: [
    "You told me to echo \"{echo}\""
  ],
  after: function(context, event, callback) {
    delete context.echo;
    DialogManager.dialogs.step_1.play(context, event, callback);
  }
});

bot.use(DialogManager);

bot.run();
```
