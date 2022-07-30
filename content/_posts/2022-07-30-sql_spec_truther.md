---
title: sql spec truther
layout: main
categories:
  - posts
---

There are two ways to make my point.
I'll start with the boring one.

---

SQL is a convention.
There are many RDBMSs that behave similarly and call themselves "SQL databases".
However, it's difficult to tell whether an application that works on one SQL database will work on another SQL database.
Similarly, validating a new RDBMS against the SQL specification ([ISO/IEC 9075][iso-9075]) would cost a nontrivial amount of time, effort, and money.
At this point, defining "SQL" as the shared behaviors of the leading SQL RDBMSs would be just as meaningful as buying and reading the SQL specification.

I'd like to see more cross-RDBMS comparisons and collections of tests to make defining "SQL" and testing SQL conformance easier.
To that end, I've started [a project comparing `information_schema` implementations][i.s.compat.table] and another project collecting [sql parser tests][sql_parser_tests].
Feel free to send me links to sample databases and other permissively-copyrighted SQL test suites!


Now for the more colorful way to state the point:

---

I don't think the SQL spec exists.

<figure style="width: 100%; text-align: center;">
<img alt="A riff on xkcd 1717" src="/assets/images/sql_spec_truther.png">
<figcaption><a href="https://xkcd.com/1717/" target="_blank">xkcd.com/1717</a>
</figcaption>
</figure>


First: have you ever actually _read_ the SQL spec ([ISO/IEC 9075][iso-9075])?
Do you know any normal, red-blooded developer who has read it? (One without hundreds of dollars to spend on standards documents)?

Second: If there actually were a SQL spec, then there would be an easy way to validate conformance to the specification.
According to legend, there was once a SQL spec conformance suite but [it was _murdered by the government_ in 1996][nist-news].
There's still [a webpage][nist-form] where you can request the 1996 NIST SQL spec conformance suite, but the form doesn't work and is probably haunted.

Third: the few public references to the alleged "SQL spec" sound like they're describing RDBMSs from some strange alternate universe:

- "catalog" instead of "database"
- "relation" instead of "table"

and so on.

Finally: the main backers of the "SQL spec" theory are a cabal of vague, yet menacing standards organizations (<abbr title="American National Standards Institution">ANSI</abbr>, <abbr title="International Standards Organization">ISO</abbr>/<abbr title="International Electrotechnical Commission">IEC</abbr>, <abbr title="InterNational Committee for Information Technology Standards">INCITS</abbr>, and likely others that have yet to emerge from the shadows).

Somehow, something called SQL still exists: PostgreSQL, MySQL, Oracle, MSSQL, SQLite, and many other RDBMSs have similar branding and behavior.
Clearly, there's some sort of conspiracy going on.

<code title="table-flip" style="display: block; width: 100%; text-align: center;">(╯°□°）╯︵ ┻━┻</code>

---


[iso-9075]: https://blog.ansi.org/2018/10/sql-standard-iso-iec-9075-2016-ansi-x3-135/
[standardization-history]: https://en.wikipedia.org/wiki/SQL#Standardization_history
[nist-form]: https://www.itl.nist.gov/div897/ctg/sql_form.htm
[nist-news]: https://www.hpcwire.com/1996/09/06/nist-will-cease-creating-new-sql-tests-by-1997/
[i.s.compat.table]: https://github.com/i-s-compat-table/
[sql_parser_tests]: https://github.com/SKalt/sql_parser_tests
[tpc-h]: https://www.tpc.org/tpch/
[nist-artifact]: https://github.com/apache/derby/tree/cc457a99b575db678e490cfb1c916100bae31dd7/java/org.apache.derby.tests/org/apache/derbyTesting/functionTests/tests/nist

<!-- 
https://www.iso.org/standard/63555.html
https://www.scattered-thoughts.net/writing/against-sql/
https://www.cockroachlabs.com/docs/stable/frequently-asked-questions.html#why-does-cockroachdb-use-the-postgresql-wire-protocol-instead-of-the-mysql-protocol
https://docs.pingcap.com/tidb/stable/overview#key-features
https://github.com/sqlparser-rs/sqlparser-rs#sql-compliance
https://github.com/elliotchance/sqltest
-->

