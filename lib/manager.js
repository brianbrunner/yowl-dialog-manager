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

var proto = module.exports = function(namespace, options) {

  options = options || {};

  if (typeof namespace == "string") {
    this.namespace = namespace;
  } else if (typeof namespace == "object") {
    options = namespace;
    this.namespace = options.namespace;
  }

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

  dialog.manager = this;

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

    // Pull out variables
    var preserve_on_error = this.options.preserve_on_error;
    var namespace = this.namespace;

    var namespace_match = (!context.session.open_dialog_namespace && !this.namespace) ||
      (context.session.open_dialog_namespace == this.namespace)
    if (namespace_match && context.session.open_dialog in this.dialogs) {

      // if this manager has the dialog, process the response
      var dialog_id = context.session.open_dialog;
      var dialog = this.dialogs[dialog_id];
      delete context.session.open_dialog;
      delete context.session.open_dialog_namespace;
      try {
        var finish = function(err) {
          if (err && preserve_on_error) {
            context.session.open_dialog = dialog_id;
            if (namespace) {
              context.session.open_dialog_namespace = namespace;
            }
          }
          next(err);
        };
        finish.done = function(err) {
          if (err && preserve_on_error) {
            context.session.open_dialog = dialog_id;
            if (namespace) {
              context.session.open_dialog_namespace = namespace;
            }
          }
          next.done(err);
        };
        dialog.onresponse(context, event, finish);
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
