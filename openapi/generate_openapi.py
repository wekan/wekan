#!/bin/env python3

import argparse
import esprima
import json
import logging
import os
import re
import sys
import traceback


logger = logging.getLogger(__name__)
err_context = 3


def get_req_body_elems(obj, elems):
    if obj.type in ['FunctionExpression', 'ArrowFunctionExpression']:
        get_req_body_elems(obj.body, elems)
    elif obj.type == 'BlockStatement':
        for s in obj.body:
            get_req_body_elems(s, elems)
    elif obj.type == 'TryStatement':
        get_req_body_elems(obj.block, elems)
    elif obj.type == 'ExpressionStatement':
        get_req_body_elems(obj.expression, elems)
    elif obj.type == 'MemberExpression':
        left = get_req_body_elems(obj.object, elems)
        right = obj.property.name
        if left == 'req.body' and right not in elems:
            elems.append(right)
        return '{}.{}'.format(left, right)
    elif obj.type == 'VariableDeclaration':
        for s in obj.declarations:
            get_req_body_elems(s, elems)
    elif obj.type == 'VariableDeclarator':
        if obj.id.type == 'ObjectPattern':
            # get_req_body_elems() can't be called directly here:
            # const {isAdmin, isNoComments, isCommentOnly} = req.body;
            right = get_req_body_elems(obj.init, elems)
            if right == 'req.body':
                for p in obj.id.properties:
                    name = p.key.name
                    if name not in elems:
                        elems.append(name)
        else:
            get_req_body_elems(obj.init, elems)
    elif obj.type == 'Property':
        get_req_body_elems(obj.value, elems)
    elif obj.type == 'ObjectExpression':
        for s in obj.properties:
            get_req_body_elems(s, elems)
    elif obj.type == 'CallExpression':
        for s in obj.arguments:
            get_req_body_elems(s, elems)
    elif obj.type == 'ArrayExpression':
        for s in obj.elements:
            get_req_body_elems(s, elems)
    elif obj.type == 'IfStatement':
        get_req_body_elems(obj.test, elems)
        if obj.consequent is not None:
            get_req_body_elems(obj.consequent, elems)
        if obj.alternate is not None:
            get_req_body_elems(obj.alternate, elems)
    elif obj.type in ('LogicalExpression', 'BinaryExpression', 'AssignmentExpression'):
        get_req_body_elems(obj.left, elems)
        get_req_body_elems(obj.right, elems)
    elif obj.type == 'ChainExpression':
        get_req_body_elems(obj.expression, elems)
    elif obj.type in ('ReturnStatement', 'UnaryExpression'):
        if obj.argument is not None:
            get_req_body_elems(obj.argument, elems)
    elif obj.type == 'Identifier':
        return obj.name
    elif obj.type in ['Literal', 'FunctionDeclaration', 'ThrowStatement']:
        pass
    else:
        # Log to stderr so it never contaminates the YAML written to stdout.
        logger.debug('unhandled AST node type: %s', getattr(obj, 'type', type(obj).__name__))
    return ''


def cleanup_jsdocs(jsdoc):
    # remove leading spaces before the first '*'
    doc = [s.lstrip() for s in jsdoc.value.split('\n')]

    # remove leading stars
    doc = [s.lstrip('*') for s in doc]

    # remove leading empty lines
    while len(doc) and not doc[0].strip():
        doc.pop(0)

    # remove terminating empty lines
    while len(doc) and not doc[-1].strip():
        doc.pop(-1)

    return doc


class JS2jsonDecoder(json.JSONDecoder):
    def decode(self, s):
        result = super().decode(s)  # result = super(Decoder, self).decode(s) for Python 2.x
        return self._decode(result)

    def _decode(self, o):
        if isinstance(o, str):
            try:
                return int(o)
            except ValueError:
                return o
        elif isinstance(o, dict):
            return {k: self._decode(v) for k, v in o.items()}
        elif isinstance(o, list):
            return [self._decode(v) for v in o]
        else:
            return o


def load_return_type_jsdoc_json(data):
    regex_replace = [(r'\n', r' '),  # replace new lines by spaces
                     (r'([\{\s,])(\w+)(:)', r'\1"\2"\3'),  # insert double quotes in keys
                     (r'(:)\s*([^:\},\]]+)\s*([\},\]])', r'\1"\2"\3'),  # insert double quotes in values
                     (r'(\[)\s*([^{].+)\s*(\])', r'\1"\2"\3'),  # insert double quotes in array items
                     (r'^\s*([^\[{].+)\s*', r'"\1"')]  # insert double quotes in single item
    for r, s in regex_replace:
        data = re.sub(r, s, data)
    return json.loads(data)


def static_route_path(node):
    '''Return the URL path string for a route's path-argument AST node, or None
    if it cannot be resolved statically.

    Handles plain string literals (`'/api/...'`) and template literals
    (`` `/api/boards/:boardId/export/${format}` ``): a `${identifier}` segment
    becomes a `:identifier` path parameter (which the existing `:name` -> `{name}`
    conversion then turns into an OpenAPI path parameter). A template literal with
    a non-identifier interpolation cannot be documented and yields None.'''
    if node is None:
        return None
    value = getattr(node, 'value', None)
    if value is not None:
        return value
    if getattr(node, 'type', None) == 'TemplateLiteral':
        quasis = getattr(node, 'quasis', None) or []
        exprs = getattr(node, 'expressions', None) or []
        parts = []
        for i, quasi in enumerate(quasis):
            parts.append((quasi.value.cooked if quasi.value else '') or '')
            if i < len(exprs):
                expr = exprs[i]
                if getattr(expr, 'type', None) == 'Identifier':
                    parts.append(':' + expr.name)
                else:
                    return None
        return ''.join(parts)
    return None


class EntryPoint(object):
    def __init__(self, schema, method_name, path_node, body_node, loc_node):
        self.schema = schema
        self._path = path_node
        self.body = body_node
        # loc_node is the AST node whose source location is used to attach the
        # JSDoc comment that precedes this entry point (the call expression).
        self.loc_node = loc_node
        self._jsdoc = None
        self._doc = {}
        self._raw_doc = None
        self.path = self.compute_path()
        self.method_name = method_name.lower()
        self.body_params = []
        if self.method_name in ('post', 'put'):
            get_req_body_elems(self.body, self.body_params)

        # replace the :parameter in path by {parameter}
        self.url = re.sub(r':([^/]*)Id', r'{\1}', self.path)
        self.url = re.sub(r':([^/]*)', r'{\1}', self.url)

        # reduce the api name
        # get_boards_board_cards() should be get_board_cards()
        tokens = self.url.split('/')
        reduced_function_name = []
        for i, token in enumerate(tokens):
            if token in ('api'):
                continue
            if (i < len(tokens) - 1 and  # not the last item
               tokens[i + 1].startswith('{')):  # and the next token is a parameter
                continue
            reduced_function_name.append(token.strip('{}'))
        self.reduced_function_name = '_'.join(reduced_function_name)

        # mark the schema as used
        schema.used = True

    def compute_path(self):
        return static_route_path(self._path).rstrip('/')

    def log(self, message, level):
        if self._raw_doc is None:
            logger.log(level, 'in {},'.format(self.schema.name))
            logger.log(level, message)
            return
        logger.log(level, 'in {}, lines {}-{}'.format(self.schema.name,
                                                      self._raw_doc.loc.start.line,
                                                      self._raw_doc.loc.end.line))
        logger.log(level, self._raw_doc.value)
        logger.log(level, message)

    def error(self, message):
        return self.log(message, logging.ERROR)

    def warn(self, message):
        return self.log(message, logging.WARNING)

    def info(self, message):
        return self.log(message, logging.INFO)

    @property
    def doc(self):
        return self._doc

    @doc.setter
    def doc(self, doc):
        '''Parse the JSDoc attached to an entry point.
        `jsdoc` will not get these right as they are not attached to a method.
        So instead, we do our custom parsing here (yes, subject to errors).

        The expected format is the following (empty lines between entries
        are ignored):
        /**
         * @operation name_of_entry_point
         * @tag: a_tag_to_add
         * @tag: an_other_tag_to_add
         * @summary A nice summary, better in one line.
         *
         * @description This is a quite long description.
         *              We can use *mardown* as the final rendering is done
         *              by slate.
         *
         *     indentation doesn't matter.
         *
         * @param param_0 description of param 0
         * @param {string} param_1 we can also put the type of the parameter
         *    before its name, like in JSDoc
         * @param {boolean} [param_2] we can also tell if the parameter is
         *    optional by adding square brackets around its name
         *
         * @return Documents a return value
         */

        Notes:
         - name_of_entry_point will be referenced in the ToC of the generated
           document. This is also the operationId used in the resulting openapi
           file. It needs to be uniq in the namesapce (the current schema.js
           file)
         - tags are appended to the current Schema attached to the file
        '''

        self._raw_doc = doc

        self._jsdoc = cleanup_jsdocs(doc)

        def store_tag(tag, data):
            # check that there is something to store first
            if not data.strip():
                return

            # remove terminating whitespaces and empty lines
            data = data.rstrip()

            # parameters are handled specially
            if tag == 'param':
                if 'params' not in self._doc:
                    self._doc['params'] = {}
                params = self._doc['params']

                param_type = None
                try:
                    name, desc = data.split(maxsplit=1)
                except ValueError:
                    desc = ''

                if name.startswith('{'):
                    param_type = name.strip('{}')
                    if param_type == 'Object':
                        # hope for the best
                        param_type = 'object'
                    elif param_type not in ['string', 'number', 'boolean', 'integer', 'array', 'file']:
                        self.warn('unknown type {}\n allowed values: string, number, boolean, integer, array, file'.format(param_type))
                    try:
                        name, desc = desc.split(maxsplit=1)
                    except ValueError:
                        desc = ''

                optional = name.startswith('[') and name.endswith(']')

                if optional:
                    name = name[1:-1]

                # we should not have 2 identical parameter names
                if tag in params:
                    self.warn('overwriting parameter {}'.format(name))

                params[name] = (param_type, optional, desc)

                if name.endswith('Id'):
                    # we strip out the 'Id' from the form parameters, we need
                    # to keep the actual description around
                    name = name[:-2]
                    if name not in params:
                        params[name] = (param_type, optional, desc)

                return

            # 'tag' can be set several times
            if tag == 'tag':
                if tag not in self._doc:
                    self._doc[tag] = []
                self._doc[tag].append(data)

                return

            # 'return' tag is json
            if tag == 'return_type':
                try:
                    data = load_return_type_jsdoc_json(data)
                except json.decoder.JSONDecodeError:
                    pass

            # we should not have 2 identical tags but @param or @tag
            if tag in self._doc:
                self.warn('overwriting tag {}'.format(tag))

            self._doc[tag] = data

        # reset the current doc fields
        self._doc = {}

        # first item is supposed to be the description
        current_tag = 'description'
        current_data = ''

        for line in self._jsdoc:
            if line.lstrip().startswith('@'):
                tag, data = line.lstrip().split(maxsplit=1)

                if tag in ['@operation', '@summary', '@description', '@param', '@return_type', '@tag']:
                    # store the current data
                    store_tag(current_tag, current_data)

                    current_tag = tag.lstrip('@')
                    current_data = ''
                    line = data
                else:
                    self.info('Unknown tag {}, ignoring'.format(tag))

            current_data += line + '\n'

        store_tag(current_tag, current_data)

    @property
    def summary(self):
        if 'summary' in self._doc:
            # new lines are not allowed
            return self._doc['summary'].replace('\n', ' ')

        return None

    def doc_param(self, name):
        if 'params' in self._doc and name in self._doc['params']:
            return self._doc['params'][name]
        return None, None, None

    def print_openapi_param(self, name, indent):
        ptype, poptional, pdesc = self.doc_param(name)
        if pdesc is not None:
            print('{}description: |'.format(' ' * indent))
            print('{}{}'.format(' ' * (indent + 2), pdesc))
        else:
            print('{}description: the {} value'.format(' ' * indent, name))
        if ptype is not None:
            print('{}type: {}'.format(' ' * indent, ptype))
        else:
            print('{}type: string'.format(' ' * indent))
        if poptional:
            print('{}required: false'.format(' ' * indent))
        else:
            print('{}required: true'.format(' ' * indent))

    @property
    def operationId(self):
        if 'operation' in self._doc:
            return self._doc['operation']
        return '{}_{}'.format(self.method_name, self.reduced_function_name)

    @property
    def description(self):
        if 'description' in self._doc:
            return self._doc['description']
        return None

    @property
    def returns(self):
        if 'return_type' in self._doc:
            return self._doc['return_type']
        return None

    @property
    def tags(self):
        tags = []
        if self.schema.fields is not None:
            tags.append(self.schema.name)
        if 'tag' in self._doc:
            tags.extend(self._doc['tag'])
        return tags

    def print_openapi_return(self, obj, indent):
        if isinstance(obj, dict):
            print('{}type: object'.format(' ' * indent))
            print('{}properties:'.format(' ' * indent))
            for k, v in obj.items():
                print('{}{}:'.format(' ' * (indent + 2), k))
                self.print_openapi_return(v, indent + 4)

        elif isinstance(obj, list):
            if len(obj) > 1:
                self.error('Error while parsing @return tag, an array should have only one type')
            print('{}type: array'.format(' ' * indent))
            print('{}items:'.format(' ' * indent))
            self.print_openapi_return(obj[0], indent + 2)

        elif isinstance(obj, str):
            rtype = 'type: ' + obj
            if obj == self.schema.name:
                rtype = '$ref: "#/definitions/{}"'.format(obj)
            print('{}{}'.format(' ' * indent, rtype))

    def print_openapi(self):
        parameters = [token[1:-2] if token.endswith('Id') else token[1:]
                      for token in self.path.split('/')
                      if token.startswith(':')]

        print('    {}:'.format(self.method_name))

        print('      operationId: {}'.format(self.operationId))

        if self.summary is not None:
            print('      summary: {}'.format(self.summary))

        if self.description is not None:
            print('      description: |')
            for line in self.description.split('\n'):
                if line.strip():
                    print('        {}'.format(line))
                else:
                    print('')

        if len(self.tags) > 0:
            print('      tags:')
            for tag in self.tags:
                print('        - {}'.format(tag))

        # export the parameters
        if self.method_name in ('post', 'put'):
            print('''      consumes:
        - multipart/form-data
        - application/json''')
        if len(parameters) > 0 or self.method_name in ('post', 'put'):
            print('      parameters:')
        if self.method_name in ('post', 'put'):
            for f in self.body_params:
                print('''        - name: {}
          in: formData'''.format(f))
                self.print_openapi_param(f, 10)
        for p in parameters:
            if p in self.body_params:
                self.error(' '.join((p, self.path, self.method_name)))
            print('''        - name: {}
          in: path'''.format(p))
            self.print_openapi_param(p, 10)
        print('''      produces:
        - application/json
      security:
          - UserSecurity: []
      responses:
        '200':
          description: |-
            200 response''')
        if self.returns is not None:
            print('          schema:')
            self.print_openapi_return(self.returns, 12)


class SchemaProperty(object):
    def __init__(self, statement, schema, context):
        self.schema = schema
        self.statement = statement
        self.name = statement.key.name or statement.key.value
        self.type = 'object'
        self.elements = []
        self.blackbox = False
        self.required = True
        imports = {}
        for p in statement.value.properties:
            try:
                if p.key.name == 'type':
                    if p.value.type == 'Identifier':
                        self.type = p.value.name.lower()
                    elif p.value.type == 'ArrayExpression':
                        self.type = 'array'
                        self.elements = [e.name.lower() for e in p.value.elements]

                elif p.key.name == 'allowedValues':
                    self.type = 'enum'
                    self.enum = []

                    def parse_enum(value, enum):
                        if value.type == 'ArrayExpression':
                            for e in value.elements:
                                parse_enum(e, enum)
                        elif value.type == 'Literal':
                            enum.append(value.value.lower())
                            return
                        elif value.type == 'Identifier':
                            # tree wide lookout for the identifier
                            def find_variable(elem, match):
                                if isinstance(elem, list):
                                    for value in elem:
                                        ret = find_variable(value, match)
                                        if ret is not None:
                                            return ret

                                try:
                                    items = elem.items()
                                except AttributeError:
                                    return None
                                except TypeError:
                                    return None

                                if (elem.type == 'VariableDeclarator' and
                                   elem.id.name == match):
                                    return elem
                                elif (elem.type == 'ImportSpecifier' and
                                     elem.local.name == match):
                                    # we have to treat that case in the caller, because we lack
                                    # information of the source of the import at that point
                                    return elem
                                elif (elem.type == 'ExportNamedDeclaration' and
                                     elem.declaration.type == 'VariableDeclaration'):
                                    ret = find_variable(elem.declaration.declarations, match)
                                    if ret is not None:
                                        return ret

                                for type, value in items:
                                    ret = find_variable(value, match)
                                    if ret is not None:
                                        if ret.type == 'ImportSpecifier':
                                            # first open and read the import source, if
                                            # we haven't already done so
                                            path = elem.source.value
                                            if elem.source.value.startswith('/'):
                                                script_dir = os.path.dirname(os.path.realpath(__file__))
                                                path = os.path.abspath(os.path.join('{}/..'.format(script_dir), elem.source.value.lstrip('/')))
                                            else:
                                                path = os.path.abspath(os.path.join(os.path.dirname(context.path), elem.source.value))
                                            path += '.js'

                                            if path not in imports:
                                                imported_context = parse_file(path)
                                                imports[path] = imported_context
                                            imported_context = imports[path]

                                            # and then re-run the find in the imported file
                                            return find_variable(imported_context.program.body, match)

                                        return ret

                                return None

                            elem = find_variable(context.program.body, value.name)

                            if elem is None:
                                raise TypeError('can not find "{}"'.format(value.name))

                            return parse_enum(elem.init, enum)

                    parse_enum(p.value, self.enum)

                elif p.key.name == 'blackbox':
                    self.blackbox = True

                elif p.key.name == 'optional' and p.value.value:
                    self.required = False
            except Exception:
                input = ''
                for line in range(p.loc.start.line - err_context, p.loc.end.line + 1 + err_context):
                    if line < p.loc.start.line or line > p.loc.end.line:
                        input += '. '
                    else:
                        input += '>>'
                    input += context.text_at(line, line)
                input = ''.join(input)
                logger.error('{}:{}-{} can not parse {}:\n{}'.format(context.path,
                                                                     p.loc.start.line,
                                                                     p.loc.end.line,
                                                                     p.type,
                                                                     input))
                logger.error('esprima tree:\n{}'.format(p))

                logger.error(traceback.format_exc())
                sys.exit(1)

        self._doc = None
        self._raw_doc = None

    @property
    def doc(self):
        return self._doc

    @doc.setter
    def doc(self, jsdoc):
        self._raw_doc = jsdoc
        self._doc = cleanup_jsdocs(jsdoc)

    def process_jsdocs(self, jsdocs):
        start = self.statement.key.loc.start.line
        for index, doc in enumerate(jsdocs):
            if start + 1 == doc.loc.start.line:
                self.doc = doc
                jsdocs.pop(index)
                return

    def __repr__(self):
        return 'SchemaProperty({}{}, {})'.format(self.name,
                                                 '*' if self.required else '',
                                                 self.doc)

    def array_elements(self):
        '''Element type(s) of an array property. `type: [Object]` records them
        directly in self.elements. The SimpleSchema `type: Array` idiom instead
        declares the element type in a sibling `<name>.$` field, so infer it
        from there ('object' refers to a generated sub-schema, primitives map to
        their own type).'''
        if self.elements:
            return self.elements

        fields = getattr(self.schema, 'fields', None) or []
        sub_name = self.name + '.$'
        for f in fields:
            if f.name == sub_name:
                t = f.type
                if t in ('enum', 'date'):
                    return ['string']
                if t == 'object':
                    return ['object']
                return [t]
        # nested object array declared as '<name>.$.<key>' fields
        prefix = self.name + '.$.'
        if any(f.name.startswith(prefix) for f in fields):
            return ['object']
        return ['object']

    def print_openapi(self, indent, current_schema, required_properties):
        schema_name = self.schema.name
        name = self.name

        # deal with subschemas
        if '.' in name:
            # The sub-schema that owns this property is every path segment
            # except the last (the property name). Joining all leading segments
            # — not just the first — keeps deeply nested objects such as
            # 'storageConfig.filesystem.enabled' and 'storageConfig.gridfs.enabled'
            # in distinct sub-schemas (StorageconfigFilesystem / StorageconfigGridfs)
            # instead of collapsing their leaf keys into one mapping, which would
            # emit duplicate 'enabled'/'read'/'write' keys and break strict YAML
            # parsers (e.g. @redocly/cli). The '$' branches below reassign this.
            subschema = ''.join([s.capitalize() for s in name.split('.')[:-1]])

            if name.endswith('$'):
                # An explicit array-element marker such as `'labels.$': {type:
                # Object}`. When sibling `'labels.$.xxx'` property fields exist
                # they define the element sub-schema, so this marker is
                # redundant — skip it to avoid emitting the sub-schema twice.
                prefix = self.name + '.'
                if any(f.name.startswith(prefix) for f in (self.schema.fields or [])):
                    return current_schema

                # reference in reference
                subschema = ''.join([n.capitalize() for n in self.name.split('.')[:-1]])
                subschema = self.schema.name + subschema
                if current_schema != subschema:
                    if required_properties is not None and required_properties:
                        print('    required:')
                        for f in required_properties:
                            print('      - {}'.format(f))
                        required_properties.clear()

                    print('''  {}:
    type: object'''.format(subschema))
                    return current_schema
            elif '$' in name:
                # In the form of 'profile.notifications.$.activity'
                subschema = name[:name.index('$') - 1]  # 'profile.notifications'
                subschema = ''.join([s.capitalize() for s in subschema.split('.')])

            schema_name = self.schema.name + subschema
            name = name.split('.')[-1]

            if current_schema != schema_name:
                if required_properties is not None and required_properties:
                    print('    required:')
                    for f in required_properties:
                        print('      - {}'.format(f))
                    required_properties.clear()

                print('''  {}:
    type: object
    properties:'''.format(schema_name))

        if required_properties is not None and self.required:
            required_properties.append(name)

        print('{}{}:'.format(' ' * indent, name))

        if self.doc is not None:
            print('{}  description: |'.format(' ' * indent))
            for line in self.doc:
                if line.strip():
                    print('{}    {}'.format(' ' * indent, line))
                else:
                    print('')

        ptype = self.type
        if ptype in ('enum', 'date'):
            ptype = 'string'
        if ptype != 'object':
            print('{}  type: {}'.format(' ' * indent, ptype))

        if self.type == 'array':
            print('{}  items:'.format(' ' * indent))
            for elem in self.array_elements():
                if elem == 'object':
                    print('{}    $ref: "#/definitions/{}"'.format(' ' * indent, schema_name + name.capitalize()))
                else:
                    print('{}    type: {}'.format(' ' * indent, elem))
                    if not self.required:
                        print('{}    x-nullable: true'.format(' ' * indent))

        elif self.type == 'object':
            if self.blackbox:
                print('{}  type: object'.format(' ' * indent))
            else:
                print('{}  $ref: "#/definitions/{}"'.format(' ' * indent, schema_name + name.capitalize()))

        elif self.type == 'enum':
            print('{}  enum:'.format(' ' * indent))
            for enum in self.enum:
                print('{}    - {}'.format(' ' * indent, enum))

        if '.' not in self.name and not self.required:
            print('{}  x-nullable: true'.format(' ' * indent))

        return schema_name


class Schemas(object):
    def __init__(self, context, data=None, jsdocs=None, name=None):
        self.name = name
        self._data = data
        self.fields = None
        self.used = False

        if data is not None:
            if self.name is None:
                self.name = data.expression.callee.object.name

            content = data.expression.arguments[0].arguments[0]
            self.fields = [SchemaProperty(p, self, context) for p in content.properties]

        self._doc = None
        self._raw_doc = None

        if jsdocs is not None:
            self.process_jsdocs(jsdocs)

    @property
    def doc(self):
        if self._doc is None:
            return None
        return ' '.join(self._doc)

    @doc.setter
    def doc(self, jsdoc):
        self._raw_doc = jsdoc
        self._doc = cleanup_jsdocs(jsdoc)

    def process_jsdocs(self, jsdocs):
        start = self._data.loc.start.line
        end = self._data.loc.end.line

        for doc in jsdocs:
            if doc.loc.end.line + 1 == start:
                self.doc = doc

        docs = [doc
                for doc in jsdocs
                if doc.loc.start.line >= start and doc.loc.end.line <= end]

        for field in self.fields:
            field.process_jsdocs(docs)

    def print_openapi(self):
        # empty schemas are skipped
        if self.fields is None:
            return

        print('  {}:'.format(self.name))
        print('    type: object')
        if self.doc is not None:
            print('    description: {}'.format(self.doc))

        print('    properties:')

        # first print out the object itself
        properties = [field for field in self.fields if '.' not in field.name]
        for prop in properties:
            prop.print_openapi(6, None, None)

        required_properties = [f.name for f in properties if f.required]
        if required_properties:
            print('    required:')
            for f in required_properties:
                print('      - {}'.format(f))

        # then print the references
        current = None
        required_properties = []
        properties = [f for f in self.fields if '.' in f.name and not '$' in f.name]
        # Emit each sub-schema's fields contiguously. The loop opens a new
        # sub-schema header whenever the owning schema changes, so interleaved
        # nested objects (e.g. 'a.filesystem', 'a.filesystem.x', 'a.gridfs',
        # 'a.gridfs.x') would otherwise reopen the parent schema 'a' multiple
        # times — duplicate mapping keys that break strict YAML parsers. Group
        # by the owning path (every segment but the last). The sort is stable,
        # so single-level schemas keep their original field order.
        properties.sort(key=lambda f: tuple(f.name.split('.')[:-1]))
        for prop in properties:
            current = prop.print_openapi(6, current, required_properties)

        if required_properties:
            print('    required:')
            for f in required_properties:
                print('      - {}'.format(f))

        required_properties = []
        # then print the references in the references
        for prop in [f for f in self.fields if '.' in f.name and '$' in f.name]:
            current = prop.print_openapi(6, current, required_properties)

        if required_properties:
            print('    required:')
            for f in required_properties:
                print('      - {}'.format(f))


def downlevel_js(data):
    '''Rewrite a few ES2020+ constructs that the (unmaintained, ES2017-era)
    esprima Python parser cannot handle into equivalent older forms, so the AST
    can still be extracted. Replacements are length-neutral per line and never
    add or remove newlines, so reported line numbers stay accurate for JSDoc and
    route matching.

      foo?.()  -> foo ()      (optional call)
      foo?.[i] -> foo [i]     (optional index)
      foo?.bar -> foo .bar    (optional member)
      a ??= b  -> a   = b     (nullish assignment)
      a ?? b   -> a || b      (nullish coalescing)
    '''
    data = data.replace('?.(', '  (')
    data = data.replace('?.[', '  [')
    data = data.replace('?.', ' .')
    data = data.replace('??=', '  =')
    data = data.replace('??', '||')
    return data


class Context(object):
    def __init__(self, path):
        self.path = path

        with open(path) as f:
            self._txt = f.readlines()

        data = ''.join(self._txt)
        options = {'comment': True, 'loc': True}
        try:
            self.program = esprima.parseModule(data, options=options)
        except Exception:
            # esprima only understands ES2017; downlevel newer syntax and retry.
            self.program = esprima.parseModule(downlevel_js(data), options=options)

    def txt_for(self, statement):
        return self.text_at(statement.loc.start.line, statement.loc.end.line)

    def text_at(self, begin, end):
        return ''.join(self._txt[begin - 1:end])


def parse_file(path):
    try:
        # if the file failed, it's likely it doesn't contain a schema
        context = Context(path)
    except:
        return

    return context


def _get(node, *attrs):
    '''Safely walk nested attributes of an esprima node, returning None as soon
    as any link in the chain is missing. Avoids AttributeError on optional
    fields of heterogeneous AST nodes.'''
    for attr in attrs:
        if node is None:
            return None
        node = getattr(node, attr, None)
    return node


# HTTP verbs recognised on the Meteor 3 `WebApp.handlers.<verb>()` routing API.
HTTP_METHODS = ('get', 'post', 'put', 'delete', 'patch')


def extract_route(call):
    '''Return (method_name, path_node, body_node) when `call` registers a REST
    API entry point, otherwise None. Two routing styles are recognised:

      * legacy json-routes:  JsonRoutes.add('GET', '/api/...', fn)
      * Meteor 3 webapp:     WebApp.handlers.get('/api/...', fn)
    '''
    if getattr(call, 'type', None) != 'CallExpression':
        return None
    callee = call.callee
    if _get(callee, 'type') != 'MemberExpression':
        return None

    # legacy: JsonRoutes.add('METHOD', '/path', fn)
    if (_get(callee, 'object', 'name') == 'JsonRoutes' and
            _get(callee, 'property', 'name') == 'add'):
        args = call.arguments
        if len(args) >= 3 and getattr(args[0], 'value', None):
            return (args[0].value, args[1], args[2])
        return None

    # Meteor 3: WebApp.handlers.<method>('/path', fn)
    if (_get(callee, 'object', 'object', 'name') == 'WebApp' and
            _get(callee, 'object', 'property', 'name') == 'handlers' and
            _get(callee, 'property', 'name') in HTTP_METHODS):
        args = call.arguments
        if len(args) >= 2:
            return (callee.property.name, args[0], args[1])
        return None

    return None


def iter_route_calls(node):
    '''Recursively yield CallExpression nodes that may register a route, in
    source order. Routes appear at the top level (Meteor 3 style) or wrapped in
    one of the server-only guards Wekan uses — `if (Meteor.isServer) { ... }`,
    `runOnServer(function () { ... })`, `Meteor.startup(...)`, try blocks — so we
    descend through those constructs and into callback function bodies.'''
    if node is None:
        return
    if isinstance(node, list):
        for n in node:
            yield from iter_route_calls(n)
        return

    ntype = getattr(node, 'type', None)
    if ntype == 'CallExpression':
        yield node
        # descend into function arguments such as runOnServer(function(){...})
        for arg in getattr(node, 'arguments', None) or []:
            if getattr(arg, 'type', None) in ('FunctionExpression', 'ArrowFunctionExpression'):
                yield from iter_route_calls(arg.body)
    elif ntype == 'ExpressionStatement':
        yield from iter_route_calls(node.expression)
    elif ntype == 'IfStatement':
        yield from iter_route_calls(node.consequent)
        yield from iter_route_calls(node.alternate)
    elif ntype == 'BlockStatement':
        yield from iter_route_calls(node.body)
    elif ntype == 'TryStatement':
        yield from iter_route_calls(node.block)
    elif ntype in ('FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'):
        yield from iter_route_calls(node.body)


def is_attach_schema(statement):
    '''True for `<Collection>.attachSchema(new SimpleSchema({...}))` statements.'''
    if getattr(statement, 'type', None) != 'ExpressionStatement':
        return False
    expr = statement.expression
    if (_get(expr, 'callee', 'property', 'name') != 'attachSchema' or
            not getattr(expr, 'arguments', None)):
        return False
    arg0 = expr.arguments[0]
    return (_get(arg0, 'type') == 'NewExpression' and
            _get(arg0, 'callee', 'name') == 'SimpleSchema')


def schema_name_for_file(filename, schemas):
    '''When a route file has no in-file schema (Meteor 3 splits routes into
    server/models/ while schemas stay in models/), associate it with the schema
    named after the file, e.g. boards.js -> Boards. Returns None if no match.'''
    base = os.path.splitext(os.path.basename(filename))[0]
    if not base:
        return None
    candidate = base[0].upper() + base[1:]
    if candidate in schemas:
        return candidate
    for name in schemas:
        if name.lower() == base.lower():
            return name
    return None


def parse_schemas(schemas_dirs):
    if isinstance(schemas_dirs, str):
        schemas_dirs = [schemas_dirs]

    schemas = {}
    entry_points = []

    # Collect every parseable file across all directories first. Schemas
    # (SimpleSchema definitions) live in models/ while the REST routes that use
    # them now live in server/models/, so we register all schemas before
    # associating them with entry points.
    parsed = []
    for schemas_dir in schemas_dirs:
        for root, dirs, files in os.walk(schemas_dir):
            files.sort()
            for filename in files:
                if not filename.endswith('.js'):
                    continue
                path = os.path.join(root, filename)
                context = parse_file(path)
                if context is None:
                    # the file doesn't contain valid JS (see parse_file)
                    continue
                jsdocs = [c for c in context.program.comments
                          if c.type == 'Block' and c.value.startswith('*\n')]
                parsed.append((path, filename, context, jsdocs))

    # Pass 1: register every schema, remembering which file each came from so
    # in-file routes (legacy single-file layout) keep their original grouping.
    schemas_in_file = {}
    for path, filename, context, jsdocs in parsed:
        try:
            for statement in context.program.body:
                if is_attach_schema(statement):
                    schema = Schemas(context, statement, jsdocs)
                    schemas[schema.name] = schema
                    schemas_in_file.setdefault(path, []).append(schema.name)
        except TypeError:
            logger.error('{}: can not parse schema'.format(path))
            raise

    # Pass 2: register every entry point and attach it to a schema.
    for path, filename, context, jsdocs in parsed:
        route_calls = []
        for call in iter_route_calls(context.program.body):
            route = extract_route(call)
            if route is not None:
                method_name, path_node, body_node = route
                if static_route_path(path_node) is None:
                    logger.warning(
                        '%s: skipping route with a non-static path that cannot be '
                        'documented (dynamic template literal).', path)
                    continue
                route_calls.append((method_name, path_node, body_node, call))

        if not route_calls:
            continue

        # Resolve the schema to group these routes under: the first schema
        # declared in the same file, else the schema named after the file, else
        # a stub keyed by the filename (no definitions, no auto tag).
        names_here = schemas_in_file.get(path)
        if names_here:
            schema_name = names_here[0]
        else:
            schema_name = schema_name_for_file(filename, schemas)
            if schema_name is None:
                schema_name = filename
                schemas[schema_name] = Schemas(context, name=schema_name)
        schema = schemas[schema_name]

        try:
            schema_entry_points = [EntryPoint(schema, method_name, path_node, body_node, call)
                                   for (method_name, path_node, body_node, call) in route_calls]
        except TypeError:
            logger.error('{}: can not parse routes'.format(path))
            raise
        entry_points.extend(schema_entry_points)

        # try to match the JSDoc block that precedes each operation
        end_of_previous_operation = -1
        for entry_point in schema_entry_points:
            loc = entry_point.loc_node.loc
            jsdoc = [j for j in jsdocs
                     if j.loc.end.line + 1 <= loc.start.line and
                        j.loc.start.line > end_of_previous_operation]
            if bool(jsdoc):
                entry_point.doc = jsdoc[-1]
            end_of_previous_operation = loc.end.line

    return schemas, entry_points


def generate_openapi(schemas, entry_points, version):
    print('''swagger: '2.0'
info:
  title: Wekan REST API
  version: {0}
  description: |
    The REST API allows you to control and extend Wekan with ease.

    If you are an end-user and not a dev or a tester, [create an issue](https://github.com/wekan/wekan/issues/new) to request new APIs.

    > All API calls in the documentation are made using `curl`.  However, you are free to use Java / Python / PHP / Golang / Ruby / Swift / Objective-C / Rust / Scala / C# or any other programming languages.

    # Production Security Concerns
    When calling a production Wekan server, ensure it is running via HTTPS and has a valid SSL Certificate. The login method requires you to post your username and password in plaintext, which is why we highly suggest only calling the REST login api over HTTPS. Also, few things to note:

    * Only call via HTTPS
    * Implement a timed authorization token expiration strategy
    * Ensure the calling user only has permissions for what they are calling and no more

schemes:
  - http

securityDefinitions:
  UserSecurity:
    type: apiKey
    in: header
    name: Authorization

paths:
  /users/login:
    post:
      operationId: login
      summary: Login with REST API
      consumes:
        - application/json
        - application/x-www-form-urlencoded
      tags:
        - Login
      parameters:
        - name: loginRequest
          in: body
          required: true
          description: Login credentials
          schema:
            type: object
            required:
              - username
              - password
            properties:
              username:
                description: |
                  Your username
                type: string
              password:
                description: |
                  Your password
                type: string
                format: password
      responses:
        200:
          description: |-
            Successful authentication
          schema:
            type: object
            required:
              - id
              - token
              - tokenExpires
            properties:
              id:
                type: string
                description: User ID
              token:
                type: string
                description: |
                  Authentication token
              tokenExpires:
                type: string
                format: date-time
                description: |
                  Token expiration date
        400:
          description: |
            Error in authentication
          schema:
            type: object
            properties:
              error:
                type: string
              reason:
                type: string
        default:
          description: |
            Error in authentication
  /users/register:
    post:
      operationId: register
      summary: Register with REST API
      description: |
        Notes:
          - You will need to provide the token for any of the authenticated methods.
      consumes:
        - application/x-www-form-urlencoded
        - application/json
      tags:
        - Login
      parameters:
        - name: username
          in: formData
          required: true
          description: |
            Your username
          type: string
        - name: password
          in: formData
          required: true
          description: |
            Your password
          type: string
          format: password
        - name: email
          in: formData
          required: true
          description: |
            Your email
          type: string
      responses:
        200:
          description: |-
            Successful registration
          schema:
            items:
              properties:
                id:
                  type: string
                token:
                  type: string
                tokenExpires:
                  type: string
        400:
          description: |
            Error in registration
          schema:
            items:
              properties:
                error:
                  type: number
                reason:
                  type: string
        default:
          description: |
            Error in registration
'''.format(version))

    # GET and POST on the same path are valid, we need to reshuffle the paths
    # with the path as the sorting key
    methods = {}
    for ep in entry_points:
        if ep.path not in methods:
            methods[ep.path] = []
        methods[ep.path].append(ep)

    sorted_paths = list(methods.keys())
    sorted_paths.sort()

    for path in sorted_paths:
        print('  {}:'.format(methods[path][0].url))

        for ep in methods[path]:
            ep.print_openapi()

    # Append hand-written paths for endpoints that cannot be auto-discovered
    # (e.g. the file/attachment API registered via WebApp.handlers.use()).
    extra_paths = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                               'extra_paths.yml')
    if os.path.exists(extra_paths):
        with open(extra_paths) as f:
            sys.stdout.write(f.read())

    print('definitions:')
    for schema in schemas.values():
        # do not export the objects if there is no API attached
        if not schema.used:
            continue

        schema.print_openapi()


def main():
    parser = argparse.ArgumentParser(description='Generate an OpenAPI 2.0 from the given JS schemas.')
    script_dir = os.path.dirname(os.path.realpath(__file__))
    default_dirs = [os.path.abspath('{}/../models'.format(script_dir)),
                    os.path.abspath('{}/../server/models'.format(script_dir))]
    parser.add_argument('--release', default='git-master', nargs=1,
                        help='the current version of the API, can be retrieved by running `git describe --tags --abbrev=0`')
    parser.add_argument('dirs', default=default_dirs, nargs='*',
                        help='the directories where to look for schemas and REST routes '
                             '(default: models server/models)')

    args = parser.parse_args()
    dirs = args.dirs if args.dirs else default_dirs
    schemas, entry_points = parse_schemas(dirs)
    generate_openapi(schemas, entry_points, args.release[0])


if __name__ == '__main__':
    main()
