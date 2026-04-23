/**
 * Jade compiler adapted from mquandalle:jade-compiler Meteor package.
 *
 * This module brings together:
 * - The custom Lexer (handles +component, if/unless/each/with)
 * - The custom Parser (wraps jade's parser with custom lexer + markdown mixin)
 * - The transpilers (FileCompiler, TemplateCompiler) that convert Jade AST to Spacebars AST
 * - The JadeCompiler API that orchestrates parse -> compile
 */

// NOTE: Do NOT use 'use strict' here. The original Meteor jade compiler code
// relies on sloppy mode behavior, e.g. setting properties on string primitives
// (which silently fails in sloppy mode but throws in strict mode).

var path = require('path');
var loadMeteorPackages = require('./meteor-packages');

// The forked jade 1.3.0 package bundled from mquandalle's fork
var jade = require('./vendor/jade');

var _compiler = null;

function getCompiler() {
  if (_compiler) return _compiler;

  var pkgs = loadMeteorPackages();
  var HTML = pkgs.HTML;
  var HTMLTools = pkgs.HTMLTools;
  var BlazeTools = pkgs.BlazeTools;
  var SpacebarsCompiler = pkgs.SpacebarsCompiler;

  // ============================================================
  // Lexer — from mquandalle:jade-compiler/lib/lexer.js
  // ============================================================

  // We get the Lexer constructor from the forked jade package
  var JadeLexer = jade.Lexer;

  // Create our custom Lexer by subclassing
  var Lexer = function(str, filename) {
    JadeLexer.call(this, str, filename);
  };
  Lexer.prototype = Object.create(JadeLexer.prototype);
  Lexer.prototype.constructor = Lexer;

  // Copy all own properties from jade Lexer prototype
  // (some are defined as own props, not on the prototype chain)
  Object.keys(JadeLexer.prototype).forEach(function(key) {
    if (!Lexer.prototype.hasOwnProperty(key)) {
      Lexer.prototype[key] = JadeLexer.prototype[key];
    }
  });

  var unwrap = function(value) {
    if (typeof value === 'string' && value.trim())
      return /^\(?(.+?)\)?$/m.exec(value.replace(/\n/g, '').trim())[1];
  };

  // Built-in components: if, unless, else if, else, with, each
  Lexer.prototype.builtInComponents = function() {
    var self = this;
    var tok;
    var captures = /^(if|unless|else if|else|with|each)\b(.*)/.exec(self.input);
    if (captures) {
      self.consume(captures[0].length);
      tok = self.tok('mixin', captures[1]);
      tok.args = unwrap(captures[2]);
      return tok;
    }
  };

  // User components: +componentName(arguments)
  Lexer.prototype.userComponents = function() {
    var self = this;
    var tok, argRegex;
    var captureComponentName = /^\+([\.\w-]+) */.exec(self.input);
    if (captureComponentName) {
      self.consume(captureComponentName[0].length);
      tok = self.tok('mixin', captureComponentName[1]);
      if (self.input[0] === '(') {
        argRegex = /^\([\s\S]*?\)(?=(([^"]*"){2})*[^"]*$)/m;
      } else {
        argRegex = /[^\n]*/;
      }
      var capturesArgs = argRegex.exec(self.input);
      self.consume(capturesArgs[0].length);
      tok.args = unwrap(capturesArgs[0]);
      return tok;
    }
  };

  // Override next() to add our custom token types
  var _lexerSuperNext = JadeLexer.prototype.next;
  Lexer.prototype.next = function() {
    var self = this;
    return self.builtInComponents() ||
           self.userComponents() ||
           _lexerSuperNext.call(self);
  };

  // ============================================================
  // Parser — from mquandalle:jade-compiler/lib/parser.js
  // ============================================================

  var JadeParser = jade.Parser;
  var jadeNodes = jade.nodes;

  var Parser = function(str, filename, options) {
    // Strip any UTF-8 BOM
    this.input = str.replace(/^\uFEFF/, '');
    this.filename = filename;
    this.blocks = {};
    this.mixins = {};
    this.options = options || {};
    var Constructor = this.options.lexer || Lexer;
    this.lexer = new Constructor(this.input, filename);
    this.contexts = [this];
    this.inMixin = false;
  };

  Parser.prototype = Object.create(JadeParser.prototype);
  Parser.prototype.constructor = Parser;

  // Override parseMixin to handle markdown component specially
  var _parserSuperParseMixin = JadeParser.prototype.parseMixin;
  Parser.prototype.parseMixin = function() {
    var tok = this.peek();
    var mixin;

    if (tok.type === 'mixin' && tok.val === 'markdown') {
      this.advance();
      this.lexer.pipeless = true;
      mixin = new jadeNodes.Mixin('markdown', '', this.parseTextBlock(), false);
      this.lexer.pipeless = false;
      return mixin;
    } else {
      return _parserSuperParseMixin.call(this);
    }
  };

  // ============================================================
  // Transpilers — from mquandalle:jade-compiler/lib/transpilers.js
  // ============================================================

  var noNewLinePrefix = '__noNewLine__';
  var startsWithNoNewLinePrefix = new RegExp('^' + noNewLinePrefix);

  var stringRepresentationToLiteral = function(val) {
    if (typeof val !== 'string')
      return null;

    var scanner = new HTMLTools.Scanner(val);
    var parsed = BlazeTools.parseStringLiteral(scanner);
    return parsed ? parsed.value : null;
  };

  var isSpecialMarkdownComponent = function(node) {
    return node.type === 'Mixin' && node.name === 'markdown';
  };

  var isTextOnlyNode = function(node) {
    var textOnlyTags = ['textarea', 'script', 'style'];
    return node.textOnly &&
           node.type === 'Tag' &&
           textOnlyTags.indexOf(node.name) !== -1;
  };

  var throwError = function(message, node) {
    message = message || 'Syntax error';
    if (node.line)
      message += ' on line ' + node.line;
    throw new Error(message);
  };

  // ---- FileCompiler ----
  var FileCompiler = function(tree, options) {
    var self = this;
    self.nodes = tree.nodes;
    self.filename = options && options.filename || '';
    self.head = null;
    self.body = null;
    self.bodyAttrs = {};
    self.templates = {};
  };

  Object.assign(FileCompiler.prototype, {
    compile: function() {
      var self = this;
      for (var i = 0; i < self.nodes.length; i++)
        self.registerRootNode(self.nodes[i]);

      return {
        head: self.head,
        body: self.body,
        bodyAttrs: self.bodyAttrs,
        templates: self.templates,
      };
    },

    registerRootNode: function(node) {
      var self = this;

      if (node.type === 'Comment' || node.type === 'BlockComment' ||
          node.type === 'TAG' && node.name === undefined) {
        return;
      } else if (node.type === 'Doctype') {
        throwError('Meteor sets the doctype for you', node);
      } else if (node.name === 'body' || node.name === 'head') {
        var template = node.name;

        if (self[template] !== null)
          throwError(template + ' is set twice', node);
        if (node.name === 'head' && node.attrs.length > 0)
          throwError('Attributes on head are not supported', node);
        else if (node.name === 'body' && node.attrs.length > 0)
          self.bodyAttrs = self.formatBodyAttrs(node.attrs);

        self[template] = new TemplateCompiler(node.block).compile();
      } else if (node.name === 'template') {
        if (node.attrs.length !== 1 || node.attrs[0].name !== 'name')
          throwError('Templates must only have a "name" attribute', node);

        var name = node.attrs[0].val.slice(1, -1);

        if (Object.prototype.hasOwnProperty.call(self.templates, name))
          throwError('Template "' + name + '" is set twice', node);

        self.templates[name] = new TemplateCompiler(node.block).compile();
      } else {
        throwError(node.type + ' must be in a template', node);
      }
    },

    formatBodyAttrs: function(attrsList) {
      var attrsDict = {};
      attrsList.forEach(function(attr) {
        if (attr.escaped)
          attr.val = attr.val.slice(1, -1);
        attrsDict[attr.name] = attr.val;
      });
      return attrsDict;
    },
  });

  // ---- TemplateCompiler ----
  var TemplateCompiler = function(tree, options) {
    var self = this;
    self.tree = tree;
    self.filename = options && options.filename || '';
  };

  Object.assign(TemplateCompiler.prototype, {
    compile: function() {
      var self = this;
      return self._optimize(self.visitBlock(self.tree));
    },

    visitBlock: function(block) {
      if (block === undefined || block === null || !Object.prototype.hasOwnProperty.call(block, 'nodes'))
        return [];

      var self = this;
      var buffer = [];
      var nodes = block.nodes;
      var currentNode, elseNode, stack;

      for (var i = 0; i < nodes.length; i++) {
        currentNode = nodes[i];

        if (currentNode.type === 'Mixin') {
          stack = [];
          while (currentNode.name === 'if' && nodes[i + 1] &&
                 nodes[i + 1].type === 'Mixin' && nodes[i + 1].name === 'else if') {
            stack.push(nodes[++i]);
          }

          if (nodes[i + 1] && nodes[i + 1].type === 'Mixin' &&
              nodes[i + 1].name === 'else') {
            stack.push(nodes[++i]);
          }

          elseNode = stack.shift();
          if (elseNode && elseNode.name === 'else if') {
            elseNode.name = 'if';
            elseNode = {
              name: 'else',
              type: 'Mixin',
              block: { nodes: [elseNode].concat(stack) },
              call: false,
            };
          }
        }

        buffer.push(self.visitNode(currentNode, elseNode));
      }

      return buffer;
    },

    getRawText: function(block) {
      var self = this;
      var parts = block.nodes.map(function(n) { return n.val; });
      parts = self._interposeEOL(parts);
      return parts.reduce(function(a, b) { return a + b; }, '');
    },

    visitNode: function(node, elseNode) {
      var self = this;
      var attrs = self.visitAttributes(node.attrs);
      var content;

      if (node.code) {
        content = self.visitCode(node.code);
      } else if (isTextOnlyNode(node) || isSpecialMarkdownComponent(node)) {
        content = self.getRawText(node.block);
        if (isSpecialMarkdownComponent(node)) {
          content = self.parseText(content, { textMode: HTML.TEXTMODE.STRING });
        }
      } else {
        content = self.visitBlock(node.block);
      }

      var elseContent = self.visitBlock(elseNode && elseNode.block);

      return self['visit' + node.type](node, attrs, content, elseContent);
    },

    visitCode: function(code) {
      var val = code.val;
      var strLiteral = stringRepresentationToLiteral(val);
      if (strLiteral !== null) {
        return noNewLinePrefix + strLiteral;
      } else {
        return [this._spacebarsParse(this.lookup(code.val, code.escape))];
      }
    },

    visitMixin: function(node, attrs, content, elseContent) {
      var self = this;
      var componentName = node.name;

      if (componentName === 'else')
        throwError('Unexpected else block', node);

      var spacebarsSymbol = content.length === 0 ? '>' : '#';
      var args = node.args || '';
      var mustache = '{{' + spacebarsSymbol + componentName + ' ' + args + '}}';
      var tag = self._spacebarsParse(mustache);

      content = self._optimize(content);
      elseContent = self._optimize(elseContent);
      if (content)
        tag.content = content;
      if (elseContent)
        tag.elseContent = elseContent;

      return tag;
    },

    visitTag: function(node, attrs, content) {
      var self = this;
      var tagName = node.name.toLowerCase();

      content = self._optimize(content, true);

      if (tagName === 'textarea') {
        attrs.value = content;
        content = null;
      } else if (tagName === 'style') {
        content = self.parseText(content);
      }

      if (!Array.isArray(content))
        content = content ? [content] : [];

      if (Object.keys(attrs).length > 0)
        content.unshift(attrs);

      return HTML.getTag(tagName).apply(null, content);
    },

    visitText: function(node) {
      var self = this;
      return node.val ? self.parseText(node.val) : null;
    },

    parseText: function(text, options) {
      text = text.replace(/#\{\s*((\.{1,2}\/)*[\w\.-]+)\s*\}/g, '{{$1}}');
      text = text.replace(/!\{\s*((\.{1,2}\/)*[\w\.-]+)\s*\}/g, '{{{$1}}}');

      options = options || {};
      options.getTemplateTag = SpacebarsCompiler.TemplateTag.parseCompleteTag;

      return HTMLTools.parseFragment(text, options);
    },

    visitComment: function(comment) {
      if (comment.buffer)
        return HTML.Comment(comment.val);
    },

    visitBlockComment: function(comment) {
      var self = this;
      comment.val = '\n' + comment.block.nodes.map(function(n) { return n.val; }).join('\n') + '\n';
      return self.visitComment(comment);
    },

    visitFilter: function(filter) {
      throwError('Jade filters are not supported in meteor-jade', filter);
    },

    visitWhen: function(node) {
      throwError('Case statements are not supported in meteor-jade', node);
    },

    visitAttributes: function(attrs) {
      if (attrs === undefined)
        return;

      if (typeof attrs === 'string')
        return attrs;

      var self = this;
      var dict = {};

      var concatAttributes = function(a, b) {
        if (typeof a === 'string' && typeof b === 'string')
          return a + b;
        if (a === undefined)
          return b;

        if (!Array.isArray(a)) a = [a];
        if (!Array.isArray(b)) b = [b];
        return a.concat(b);
      };
      var dynamicAttrs = [];

      attrs.forEach(function(attr) {
        var val = attr.val;
        var key = attr.name;

        var strLiteral = stringRepresentationToLiteral(val);
        if (strLiteral) {
          val = self.parseText(strLiteral, { textMode: HTML.TEXTMODE.STRING });
          // parseText may return a primitive string; only set .position on objects/arrays
          if (val !== null && val !== undefined && typeof val === 'object') {
            val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE;
          }
        } else if (val === true || val === "''" || val === '""') {
          val = '';
        } else {
          val = self._spacebarsParse(self.lookup(val, attr.escaped));
          if (val !== null && val !== undefined && typeof val === 'object') {
            val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_ATTRIBUTE;
          }
        }

        if (key === '$dyn') {
          if (val !== null && val !== undefined && typeof val === 'object') {
            val.position = HTMLTools.TEMPLATE_TAG_POSITION.IN_START_TAG;
          }
          return dynamicAttrs.push(val);
        } else if ((key === 'class' || key === 'id') && dict[key]) {
          val = [' ', val];
        }

        dict[key] = concatAttributes(dict[key], val);
      });

      if (dynamicAttrs.length === 0) {
        return dict;
      } else {
        dynamicAttrs.unshift(dict);
        return HTML.Attrs.apply(null, dynamicAttrs);
      }
    },

    lookup: function(val, escape) {
      var mustache = '{{' + val + '}}';
      if (!escape)
        mustache = '{' + mustache + '}';
      return HTMLTools.parseFragment(mustache);
    },

    _spacebarsParse: SpacebarsCompiler.TemplateTag.parse,

    _removeNewLinePrefixes: function(array) {
      var removeNewLinePrefix = function(val) {
        if (startsWithNoNewLinePrefix.test(val))
          return val.slice(noNewLinePrefix.length);
        else
          return val;
      };

      if (!Array.isArray(array))
        return removeNewLinePrefix(array);
      else
        return array.map(removeNewLinePrefix);
    },

    _interposeEOL: function(array) {
      for (var i = array.length - 1; i > 0; i--) {
        if (!startsWithNoNewLinePrefix.test(array[i]))
          array.splice(i, 0, '\n');
      }
      return array;
    },

    _optimize: function(content, interposeEOL) {
      var self = this;

      if (!Array.isArray(content))
        return self._removeNewLinePrefixes(content);

      if (content.length === 0)
        return undefined;
      if (content.length === 1)
        content = self._optimize(content[0]);
      else if (interposeEOL)
        content = self._interposeEOL(content);
      else
        content = content;

      return self._removeNewLinePrefixes(content);
    },
  });

  // ============================================================
  // JadeCompiler API — from mquandalle:jade-compiler/lib/exports.js
  // ============================================================

  var codeGen = SpacebarsCompiler.codeGen;

  var JadeCompiler = {
    parse: function(source, options) {
      options = options || {};
      var parser, Compiler;

      try {
        parser = new Parser(source, options.filename || '', { lexer: Lexer });
        Compiler = (options.fileMode) ? FileCompiler : TemplateCompiler;
        return new Compiler(parser.parse(), options).compile();
      } catch (err) {
        throw err;
      }
    },

    compile: function(source) {
      var ast = JadeCompiler.parse(source, { fileMode: false });
      return codeGen(ast);
    },
  };

  _compiler = {
    JadeCompiler: JadeCompiler,
    SpacebarsCompiler: SpacebarsCompiler,
    HTML: HTML,
  };

  return _compiler;
}

module.exports = getCompiler;
