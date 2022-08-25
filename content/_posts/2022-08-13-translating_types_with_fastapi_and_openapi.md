---
title: translating types with fastapi and openapi
layout: main
categories:
  - posts
---

TL;DR: Using [`mypy`][mypy], [`pydantic`][pydantic], and [`FastAPI`][fastapi], I generate an `openapi.yaml`, then I use [`openapi-generator`][openapi-generator] to create a typescript API client.
This means I get an API client for free, and (mostly) preserve type safety across my tech stack!

See also: https://fastapi.tiangolo.com/advanced/generate-clients/

## Exposition: why FastAPI?

At [`$DAY_JOB`][$day_job], I write a full-stack application.
I wrote the backend in Python3.8+, which means we can check static type annotations using [`mypy`][mypy].

As of 2022, I still have to `cast()` to appease `mypy` often enough that you might mistake me for a wizard. The reduced likelihood of `TypeError`s or `KeyError`s is well worth putting up with `mypy`'s rough edges.

The safety provided by checking our python codebase doesn't protect my frontend codebase, which I write in typescript.
If I change an API endpoint without updating the API client, I risk introducing client-side `TypeError`s.

<!-- Similarly, if I changed a database query without changing the type annotation of the result in the Python server, I might get a nasty surprise. -->

Here's where `FastAPI` comes in.
`FastAPI` uses type annotations and `pydantic` models to validate request and response types at runtime. as well as for generating an OpenAPI v3 schema document.
`FastAPI` can generate an OpenAPI v3 schema from the same information it uses for validation.
An OpenAPI v3 schema includes all the information necessary to create an API client:
- request methods
- request paths
- parameter names and types
- response codes
- response MIME types
- (where applicable) responses' JSON schema.

`openapi-generator` can do just that: compile an OpenAPI spec into an API client written in [a wide sample of languages and frameworks][generators].

## Example

<details open markdown="block"><summary>First, set up a new python project:</summary>


```sh
poetry new --name api fastapi_typescript_ex && cd $_
poetry add fastapi uvicorn typer PyYAML
poetry add --dev mypy black flake8
mkdir -p server && touch server/__init__.py
mkdir -p scripts && touch scripts/__init__.py
```


</details>

<details open markdown="block"><summary>Then, write a simple API:</summary>

```py
# ./server/api.py
from fastapi import FastAPI
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel
from datetime import datetime
from typing import Generic,  List, Optional,  TypeVar


class BlogPost(BaseModel):
    "a blog post"
    title: str
    author: str
    content: str
    published: datetime


Data = TypeVar("Data")


class Response(GenericModel, Generic[Data]):
    "a generic api response"
    data: Data
    errors: Optional[List[str]]


api = FastAPI()


@api.get("/api/greeting", response_model=Response[str])
def greet(to_greet: str) -> Response[str]:
    "say hello"
    return Response[str](data=f"hello {to_greet}")


@api.get(
    "/api/blog/posts",
    response_model=Response[List[BlogPost]]
)
async def get_blog_posts() -> Response[List[BlogPost]]:
    "Serve up some _original content_"
    return Response[List[BlogPost]](data=[
        {
            # you can pass dicts, which are
            # validated at runtime
            "title": "foo",
            "content": "title was SEO, this is about bar",
            "author": "baz",
            "published": datetime.now()
        },
        BlogPost(
            # alternately, mypy can validate
            # that a BlogPost is a BlogPost statically
            title="foo 2",
            content="a repost of foo, now with more bar",
            author="baz",
            published=datetime.now()
        )
    ])
```

</details>

<details open markdown="block"><summary>Add a CLI to run a development server or print the OpenAPI spec:</summary>

```py
# ./server/__main__.py
import enum
import typer
import json
import yaml
import uvicorn

from .api import api

cli = typer.Typer(name="server")
host_opt = typer.Option(
    "127.0.0.1", help="on what IP to host the server"
)


@cli.command(
    "develop",
    help="run a development server with livereload"
)
def dev_server(*, host=host_opt):
    uvicorn.run("server.api:api", host=host)


class Format(enum.Enum):
    json = "json"
    yaml = "yaml"


@cli.command(
    "print-openapi",
    help="write the openapi spec as JSON to STDOUT"
)
def print_api_spec(
    format: Format = typer.Option(
        Format.json.value,
        help="how to format the OpenAPI spec",
    )):
    openapi = api.openapi()
    if format == Format.json:
        print(json.dumps(openapi, sort_keys=True, indent=2))
    elif format == Format.yaml:
        print(yaml.dump(openapi, sort_keys=True, indent=2))


if __name__ == "__main__":
    cli()
```

</details>


<details open markdown="block"><summary>Add a script to generate the api client:</summary>

```py
# scripts/generate_client.py
import os
import subprocess
from pathlib import Path

import typer

this_dir = Path(__file__).parent
repo_root = Path(this_dir).parent
client_dir = Path(repo_root, "client")
api_spec = Path(repo_root, "server/openapi.yaml")


def main(
    *,
    input_spec: Path = typer.Option(
        api_spec,
        help="the openapi v3 spec for the api"
    ),
    client_generator: str = typer.Option(
        "typescript-fetch",
        help=(
            "the runtime for the api client; see"
            " https://openapi-generator.tech/docs/generators"
        ),
    ),
    output_dir: Path = typer.Option(
        client_dir,
        help="where to place the generated api client"
    ),
    dry_run: bool = typer.Option(
        False,
        help=(
          "Print the subcommand that would be run "
          "instead of actually running it"
        ),
    ),
) -> None:
    "generate an api client from the"
    relative_path_to_spec = input_spec.relative_to(os.getcwd())
    assert input_spec.exists(), \
      f"{relative_path_to_spec} does not exist"
    assert input_spec.is_file(), \
      f"{relative_path_to_spec} is not a file"

    assert (
        output_dir.is_dir() or not output_dir.exists()
    ), f"{output_dir.relative_to(os.getcwd())} is a file"
    os.makedirs(output_dir, exist_ok=True)
    cmd = [
        "docker",
        "run",
        "--rm",
        f"--user={os.getuid()}:{os.getgid()}",
        f"--volume={repo_root.absolute()}:/local",
        "--workdir=/local",
        "docker.io/openapitools/openapi-generator-cli:v6.0.1",
        "generate",
        "-i",
        input_spec.relative_to(repo_root),
        "-g",
        client_generator,
        "-o",
        output_dir.relative_to(repo_root),
    ]
    if dry_run:
        print(f"would run: `{' '.join(cmd)}`")
    else:
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    typer.run(main)
```

</details>

<details open markdown="block"><summary>Add a build script to perform all the steps:</summary>

```make
# Makefile

.PHONY: all install client openapi-spec dev-server clean

all: install client dev-server

install:
	poetry install

dev-server:
	poetry run python3 -m server develop

client: ./client/index.ts
./client/index.ts: ./server/openapi.yaml
	poetry run python3 -m scripts.generate_client

openapi-spec: ./server/openapi.yaml
./server/openapi.yaml: ./server/api.py
	poetry run python3 -m server \
		print-openapi --format yaml \
		> ./server/openapi.yaml

clean:
	rm -rf ./client ./server/openapi.yaml
```

</details>

This means I can guarantee my api client is up-to-date by running `make`.

You can see a live example of this code [here][example-repo].

[$day_job]: https://resurety.com/about#careers
[openapi-generator]: https://openapi-generator.tech/
[fastapi]: https://fastapi.tiangolo.com/
[pydantic]: https://pydantic-docs.helpmanual.io/
[mypy]: http://mypy-lang.org/
[generators]: https://openapi-generator.tech/docs/generators
[example-repo]: https://github.com/SKalt/fastapi-example
