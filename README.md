# yowl-dialog-manager

Multi-interaction dialog management for yowl

## Install

```bash
$ npm install yowl-dialog-manager --save
```

Dialog Manager also requires a persistent yowl session to handle dialog chaining and responses.

[yowl-session-memory](https://github.com/brianbrunner/yowl-session-memory)  
[yowl-session-memory](https://github.com/brianbrunner/yowl-session-redis)  
[yowl-session-rethink](https://github.com/brianbrunner/yowl-session-rethink)

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
    context.session.echo = event.message;
    DialogManager.dialogs.step_2.play(context, event, callback);
  }
});

DialogManager.add('step_2', {
  messages: [
    "You told me to echo \"{echo}\""
  ],
  after: function(context, event, callback) {
    delete context.session.echo;
    DialogManager.dialogs.step_1.play(context, event, callback);
  }
});

bot.use(DialogManager);

bot.run();
```

Install all dependencies.

```bash
$ npm install --save yowl yowl-platform-cli yowl-dialog-manager yowl-context-memory
```

Then run your bot.

```bash
node bot.js --local
```

## Usage

`yowl-dialog-manager` exports a `Manager` class that can be instantiated and then added to a bot with `bot.use()`

```js
var yowl = require('yowl');
var bot = yowl();

var Manager = require('yowl-dialog-manager');
var myManager = Manager();

bot.use(myManager);
```

Dialogs are added to the manager using `Manager.add(dialog_id, dialog_object)`

Dialogs have the following options.

  * `messages` (Array, Required) - A list of strings to send to the user. Strings are automatically interpolated using values from the local context. So if your context is `{ name: "Goose" }` and your string is `Hello there {name}!`, the user will be sent `Hello there Goose!`. Variable names for interpolation can include multiple levels of properties (e.g. `{user.name}`)
  * `test` (Boolean or Function, Optional, Default `false`) - This determines whether or not a dialog should be run. If this is a boolean, `true` will always cause the dialog to run and `false` will cause it to never run. If it's a function, the function should resemble `function(context, event) { ... some code ... }` and should return a boolean.
  * `onresponse` (Function(context, event, callback) - A function to run when the user responds to a dialog. When a dialog with `onresponse` defined is run, the manager will automatically ensure that the `onresponse` function is running when the user sends a new interaction. It must call callback.
  * `before` (Function(context, event, callback), Optional) - A function to run before sending `messages`. It must call callback.
  * `after` (Function(context, event, callback), Optional) - A function to run after sending `messages`. It must call callback.

## Chaining Dialogs

You'll often want to call another dialog from the `after` or `onresponse` functions. This can be done by calling a dialog's `play` function. By default, all dialogs are available by their id on their associated manager's `dialogs` property.

```js
DialogManager.add('step_1', {
  messages: [
    "When you respond, I'll call another dialog!!!"
  ],
  onresponse: function(context, event, callback) {
    context.user_message = event.message;
    DialogManager.dialogs.step_2.play(context, event, callback);
  }
});

DialogManager.add('step_2', {
  messages: [
    "Here's the other dialog!!!",
    "You said {user_message}.",
    "Now we start all over again."
  ],
  after: function(context, event, callback) {
    delete context.user_message;
    DialogManager.dialogs.step_1.play(context, event, callback);
  }
});
```

## Organization

You can structure your project so you have multiple dialog managers in seperate files, and then include them all.

```js
var onboardingDialogs = require('./dialogs/onboarding');
var settingsDialogs = require('./dialogs/settings');
var interactionDialogs = require('./dialogs/interactions');

bot.use(onboardingDialogs);
bot.use(settingsDialogs);
bot.use(interactionDialogs);
```


