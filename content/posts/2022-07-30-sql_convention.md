---
title: SQL is a convention
layout: main
categories:
  - posts
---

SQL is a convention.
There are many <abbr title="Relational DataBase Management System">RDBMS</abbr>s that behave similarly and call themselves "SQL databases".
However, it's difficult to tell whether an application that works on one SQL database will work on another SQL database.
Similarly, validating a new RDBMS against the SQL specification ([ISO/IEC 9075][iso-9075]) would cost a nontrivial amount of time, effort, and money.
At this point, defining "SQL" as the shared behaviors of the leading SQL RDBMSs would be just as meaningful as buying and reading the SQL specification.

I'd like to see more cross-RDBMS comparisons and collections of tests to make defining "SQL" and testing SQL conformance easier.
To that end, I've started [a project comparing `information_schema` implementations][i.s.compat.table] and another project collecting [sql parser tests][sql_parser_tests].
Feel free to send me links to sample databases and other permissively-copyrighted SQL test suites!

[iso-9075]: https://blog.ansi.org/2018/10/sql-standard-iso-iec-9075-2016-ansi-x3-135/
[standardization-history]: https://en.wikipedia.org/wiki/SQL#Standardization_history
[i.s.compat.table]: https://github.com/i-s-compat-table/
[sql_parser_tests]: https://github.com/skalt/sql_parser_tests
[nist-artifact]: https://github.com/apache/derby/tree/cc457a99b575db678e490cfb1c916100bae31dd7/java/org.apache.derby.tests/org/apache/derbyTesting/functionTests/tests/nist

<!--
[tpc-h]: https://www.tpc.org/tpch/
[nist-form]: https://www.itl.nist.gov/div897/ctg/sql_form.htm
[nist-news]: https://www.hpcwire.com/1996/09/06/nist-will-cease-creating-new-sql-tests-by-1997/
https://www.iso.org/standard/63555.html
https://www.scattered-thoughts.net/writing/against-sql/
https://www.cockroachlabs.com/docs/stable/frequently-asked-questions.html#why-does-cockroachdb-use-the-postgresql-wire-protocol-instead-of-the-mysql-protocol
https://docs.pingcap.com/tidb/stable/overview#key-features
https://github.com/sqlparser-rs/sqlparser-rs#sql-compliance
https://github.com/elliotchance/sqltest
-->
