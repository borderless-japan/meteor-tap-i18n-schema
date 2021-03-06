'use strict';

SimpleSchema.extendOptions({
  i18n: Match.Optional(Boolean)
});

var originAttachSchema = Mongo.Collection.prototype.attachSchema,
  originCollection = TAPi18n.Collection,
  i18nCollection = function (name, options) {
    var collection = originCollection(name, options);

    if (Meteor.isClient && ((Package["yogiben:admin"] != null) ||
      (Package["ansyg:i18n-admin"] != null) ||
      (Package["orionjs:core"] != null))) {
      collection._disableTransformationOnRoute(/^\/admin(\/?$|\/)/);
    }

    if (options && !options.languages) {
      options.languages = [ 'en' ];
    }

    collection._languages = options.languages;
    collection.attachI18nSchema = function (ss, opts) {
      ss = (ss instanceof SimpleSchema)? ss.schema() : ss;
      var i18nSchema = _.extend({}, ss), langs;
      if (typeof ss !== 'object') {
        throw new Meteor.Error('schema-error',
          'Please check your schema pass to attachI18nSchema');
      }

      langs = _.filter(collection._languages, function (lang) {
        return lang !== collection._base_language;
      });

      if (!langs.length) {
        return originAttachSchema.call(this, ss, opts);
      }

      _.each(i18nSchema, function (field, key) {
        if (!field['i18n']) return;
        _.each(langs, function (lang, index) {
          var value = _.extend({}, field, {
            optional: true
          });
          if (opts && opts.i18n && opts.i18n.autolabel) {
            value.label += ' ('+lang+')';
          }
          i18nSchema['i18n.' + lang + '.' + key] = value;
        });
      });

      return originAttachSchema.call(this, i18nSchema, opts);
    };

    return collection;
  };

TAPi18n.Collection = i18nCollection;
