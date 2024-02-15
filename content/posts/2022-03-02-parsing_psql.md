---
title: parsing psql
layout: main
categories:
  - posts
---

TL;DR: I wrote a bad [`psql`][psql-docs] meta-command parser so you don't have to. Get it at https://github.com/skalt/psql_splitter.

I've received incredulous looks after saying that my preferred way to manually interact with a a postgres database is with command-line [`psql`][psql-docs].
To be clear, I earned those looks: anyone looking over my shoulder at me working would be as bewildered as I was while I developed this particular command-line habit.
At this point stockholm syndrome has set in and I feel like I'm most productive tapping out meta-commands.

Meta-commands are the trade-off of using `psql`. On one hand, meta-commands are useful commands. My favorite meta-commands are probably `COPY table_name FROM STDIN ... \.` and `\copy table_name from 'path/to/file'` which allow for bulk data inserts without writing out and escaping giant `INSERT INTO table_name VALUES (...), ...;` statements.

```sql
COPY my_table FROM STDIN
space   separated data
almost  a         tsv
scans   until     delimiter
\.
```

Much nicer.

My second-favorite is `\include_relative`, with which I can split a large <abbr title="Data Definition Language">DDL</abbr> codebase into an organized directory tree.

On the other hand, meta-commands alter the parsing of the SQL you enter into `psql`
(see [`psqlscanslash.l`](https://github.com/postgres/postgres/blob/master/src/bin/psql/psqlscanslash.l) in the postgres codebase)
.
If you add a meta-command into a `.sql` file (like `pg_dump` does by default and I do by choice), the file no longer parses as pure sql.
To write tooling that understands your `.sql` file, you need some way to parse psql's dialect.

That's where my parser comes in.
I used the `nom` parser combinator library to hack together _just_ enough of a lexer to recognize where psql meta-commands, sql strings, comments, and other tokens.
That's enough to split a SQL file into separate statements, recognize the `psql`-specific statements, and then remove or interpret them.
However, I spent exactly zero effort optimizing the parser in order to get a working prototype out the door. I expect the parser's worst-case performance to be pretty bad. Still, it works, and its output looks right!

I'm hoping this library gets used in other postgres tooling. I've already used the library to make a tool to make tools to make postgres tooling! I split the entire postgres regression-test suite into separate statements [here](https://github.com/skalt/pg_sql_parser_tests/), which I'm using in a different postgres-dialect-parsing exercise.

[psql-docs]: https://www.postgresql.org/docs/current/app-psql.html
