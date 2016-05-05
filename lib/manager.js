/*!
 * yowl
 * Copyright(c) 2016 Brian Brunner
 * MIT Licensed
 */

'use strict';

/**
 * Module Dependencies
 * @private
 */

var Dialog = require('./dialog');
var Router = require('yowl').Router;

/**
 * Initialize a new `DialogManager` with the given `options`.
 *
 * @param {Object} options
 * @return {Router} which is a callable function
 * @public
 */

var proto = module.exports = function(options) {

  function dialogManager(context, event, next) {
    dialogManager.handle(context, event, next);
  }

  // mixin DialogManager class functions
  dialogManager.__proto__ = proto;

  // Create an underlying Router to handle routing
  dialogManager.router = Router(options);

  dialogManager.options = options;
  dialogManager.dialogs = {};

  return dialogManager;
};

/**
 * Expose Our Exports
 */

module.exports.Dialog = Dialog;

/**
 * Add a dialog to the manager
 */

proto.add = function add(id, options) {

  var dialog = (options instanceof Dialog) ? options : Dialog(id, options);

  if (id in this.dialogs) {
    throw new Error("Trying to add a dialog with id " + id + " but that id is already taken");
  }

  dialog.id = id;
  this.dialogs[id] = dialog;

  this.router.stack.push(dialog.route);

};

/**
 * Pass through handle/use functions to the underlying router
 */

proto.handle = function handle(context, event, next) {
  if (typeof context.session.open_dialog !== "undefined") {

    if (context.session.open_dialog in this.dialogs) {

      // if this manager has the dialog, process the response
      var dialog_id = context.session.open_dialog;
      var dialog = this.dialogs[dialog_id];
      delete context.session.open_dialog;
      try {
        dialog.onresponse(context, event, function(err) {
          if (err) {
            context.session.open_dialog = dialog_id;
          }
          next(err);
        });
      } catch(err) {
        context.session.open_dialog = dialog_id;
        next(err);
      }

    } else {
      // If this manager doesn't have the dialog, pass the response on
      next();
    }

  } else {
    this.router.handle(context, event, next);
  }
};

proto.use = function use() {
  this.router.use.apply(this.router, arguments);
};
