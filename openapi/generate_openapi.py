#!/bin/env python3

import argparse
import esprima
import json
import os
import re
import sys


def get_req_body_elems(obj, elems):
    if obj.type == 'FunctionExpression':
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
    elif obj.type in ('ReturnStatement', 'UnaryExpression'):
        get_req_body_elems(obj.argument, elems)
    elif obj.type == 'Literal':
        pass
    elif obj.type == 'Identifier':
        return obj.name
    elif obj.type == 'FunctionDeclaration':
        pass
    else:
        print(obj)
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
        if isinstance(o, str) or isinstance(o, unicode):
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


class EntryPoint(object):
    def __init__(self, schema, statements):
        self.schema = schema
        self.method, self._path, self.body = statements
        self._jsdoc = None
        self._doc = {}
        self._raw_doc = None
        self.path = self.compute_path()
        self.method_name = self.method.value.lower()
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
        return self._path.value.rstrip('/')

    def error(self, message):
        if self._raw_doc is None:
            sys.stderr.write('in {},\n'.format(self.schema.name))
            sys.stderr.write('{}\n'.format(message))
            return
        sys.stderr.write('in {}, lines {}-{}\n'.format(self.schema.name,
                                                       self._raw_doc.loc.start.line,
                                                       self._raw_doc.loc.end.line))
        sys.stderr.write('{}\n'.format(self._raw_doc.value))
        sys.stderr.write('{}\n'.format(message))

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
                    if param_type not in ['string', 'number', 'boolean', 'integer', 'array', 'file']:
                        self.error('Warning, unknown type {}\n allowed values: string, number, boolean, integer, array, file'.format(param_type))
                    try:
                        name, desc = desc.split(maxsplit=1)
                    except ValueError:
                        desc = ''

                optional = name.startswith('[') and name.endswith(']')

                if optional:
                    name = name[1:-1]

                # we should not have 2 identical parameter names
                if tag in params:
                    self.error('Warning, overwriting parameter {}'.format(name))

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
                self.error('Warning, overwriting tag {}'.format(tag))

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
                    self.error('Unknown tag {}, ignoring'.format(tag))

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

        elif isinstance(obj, str) or isinstance(obj, unicode):
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
    def __init__(self, statement, schema):
        self.schema = schema
        self.statement = statement
        self.name = statement.key.name or statement.key.value
        self.type = 'object'
        self.blackbox = False
        self.required = True
        for p in statement.value.properties:
            if p.key.name == 'type':
                if p.value.type == 'Identifier':
                    self.type = p.value.name.lower()
                elif p.value.type == 'ArrayExpression':
                    self.type = 'array'
                    self.elements = [e.name.lower() for e in p.value.elements]

            elif p.key.name == 'allowedValues':
                self.type = 'enum'
                self.enum = [e.value.lower() for e in p.value.elements]

            elif p.key.name == 'blackbox':
                self.blackbox = True

            elif p.key.name == 'optional' and p.value.value:
                self.required = False

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

    def print_openapi(self, indent, current_schema, required_properties):
        schema_name = self.schema.name
        name = self.name

        # deal with subschemas
        if '.' in name:
            if name.endswith('$'):
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

            subschema = name.split('.')[0]
            schema_name = self.schema.name + subschema.capitalize()
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
            for elem in self.elements:
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
    def __init__(self, data=None, jsdocs=None, name=None):
        self.name = name
        self._data = data
        self.fields = None
        self.used = False

        if data is not None:
            if self.name is None:
                self.name = data.expression.callee.object.name

            content = data.expression.arguments[0].arguments[0]
            self.fields = [SchemaProperty(p, self) for p in content.properties]

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
        properties = [f for f in self.fields if '.' in f.name and not f.name.endswith('$')]
        for prop in properties:
            current = prop.print_openapi(6, current, required_properties)

        if required_properties:
            print('    required:')
            for f in required_properties:
                print('      - {}'.format(f))

        required_properties = []
        # then print the references in the references
        for prop in [f for f in self.fields if '.' in f.name and f.name.endswith('$')]:
            current = prop.print_openapi(6, current, required_properties)

        if required_properties:
            print('    required:')
            for f in required_properties:
                print('      - {}'.format(f))


def parse_schemas(schemas_dir):

    schemas = {}
    entry_points = []

    for root, dirs, files in os.walk(schemas_dir):
        files.sort()
        for filename in files:
            path = os.path.join(root, filename)
            with open(path) as f:
                data = ''.join(f.readlines())
                try:
                    # if the file failed, it's likely it doesn't contain a schema
                    program = esprima.parseScript(data, options={'comment': True, 'loc': True})
                except:
                    continue

                current_schema = None
                jsdocs = [c for c in program.comments
                          if c.type == 'Block' and c.value.startswith('*\n')]

                for statement in program.body:

                    # find the '<ITEM>.attachSchema(new SimpleSchema(<data>)'
                    # those are the schemas
                    if (statement.type == 'ExpressionStatement' and
                       statement.expression.callee is not None and
                       statement.expression.callee.property is not None and
                       statement.expression.callee.property.name == 'attachSchema' and
                       statement.expression.arguments[0].type == 'NewExpression' and
                       statement.expression.arguments[0].callee.name == 'SimpleSchema'):

                        schema = Schemas(statement, jsdocs)
                        current_schema = schema.name
                        schemas[current_schema] = schema

                    # find all the 'if (Meteor.isServer) { JsonRoutes.add('
                    # those are the entry points of the API
                    elif (statement.type == 'IfStatement' and
                          statement.test.type == 'MemberExpression' and
                          statement.test.object.name == 'Meteor' and
                          statement.test.property.name == 'isServer'):
                            data = [s.expression.arguments
                                    for s in statement.consequent.body
                                    if (s.type == 'ExpressionStatement' and
                                        s.expression.type == 'CallExpression' and
                                        s.expression.callee.object.name == 'JsonRoutes')]

                            # we found at least one entry point, keep them
                            if len(data) > 0:
                                if current_schema is None:
                                    current_schema = filename
                                    schemas[current_schema] = Schemas(name=current_schema)

                                schema_entry_points = [EntryPoint(schemas[current_schema], d)
                                                       for d in data]
                                entry_points.extend(schema_entry_points)

                                # try to match JSDoc to the operations
                                for entry_point in schema_entry_points:
                                    operation = entry_point.method  # POST/GET/PUT/DELETE
                                    jsdoc = [j for j in jsdocs
                                             if j.loc.end.line + 1 == operation.loc.start.line]
                                    if bool(jsdoc):
                                        entry_point.doc = jsdoc[0]

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
      responses:
        200:
          description: |-
            Successful authentication
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
            Error in authentication
          schema:
            items:
              properties:
                error:
                  type: number
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

    print('definitions:')
    for schema in schemas.values():
        # do not export the objects if there is no API attached
        if not schema.used:
            continue

        schema.print_openapi()


def main():
    parser = argparse.ArgumentParser(description='Generate an OpenAPI 2.0 from the given JS schemas.')
    script_dir = os.path.dirname(os.path.realpath(__file__))
    parser.add_argument('--release', default='git-master', nargs=1,
                        help='the current version of the API, can be retrieved by running `git describe --tags --abbrev=0`')
    parser.add_argument('dir', default='{}/../models'.format(script_dir), nargs='?',
                        help='the directory where to look for schemas')

    args = parser.parse_args()
    schemas, entry_points = parse_schemas(args.dir)
    generate_openapi(schemas, entry_points, args.release[0])


if __name__ == '__main__':
    main()
