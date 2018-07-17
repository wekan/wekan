
# OpenAPI tools and doc generation

## Open API generation

This folder contains a script (`generate_openapi.py`) that extracts
the REST API of Wekan and exports it under the OpenAPI 2.0 specification
(Swagger 2.0).

### dependencies
- python3
- [esprima-python](https://github.com/Kronuz/esprima-python)

### calling the tool

    python3 generate_openapi.py --release v1.65 > ../public/wekan_api.yml

## Generating docs
Now that we have the OpenAPI, it's easy enough to convert the YAML file into some nice Markdown with
[shins](https://github.com/Mermade/shins) and [api2html](https://github.com/tobilg/api2html),
or even [ReDoc](https://github.com/Rebilly/ReDoc):

    api2html -c ../public/wekan-logo-header.png -o api.html ../public/wekan_api.yml

or

    redoc-cli serve ../public/wekan_api.yml
