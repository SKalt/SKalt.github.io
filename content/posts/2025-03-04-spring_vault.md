---
title: "Improving Spring Boot Configuration Security with Hashicorp Vault"
date: 2025-03-04
params:
  toc: false
---

## The problem

If you're using Spring Boot with [Spring Data JPA](https://spring.io/projects/spring-data-jpa), you've probably got a configuration file like this sitting near your server:

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://mysqldb:3306/mydb
    username: root        # <-- credentials
    password: password123 # <--
```

If you're a fan of [12-factor apps][12factor], you might draw the app configuration/database credentials from [environment variables][env-vars].
Alternately, you might be drawing credentials from your cloud vendor's secrets manager.
In any case, **you're probably using credentials that need to be accessible when the server starts and valid until the server shuts down**.

There's a better way.

## Vault can help

[Hashicorp Vault][vault] supports provisioning [short-lived, automatically rotated credentials called "dynamic secrets"](https://www.vaultproject.io/use-cases/dynamic-secrets).
Compared to long-lived credentials, dynamic secrets have a tiny blast radius if they get accidentally invalidated or leaked: each dynamic secret affects a single server for a short period of time.
Managing dynamic secrets through [Vault's `lease` API][vault-lease] saves a significant amount of operational pain.

## How to use Vault with Spring Boot

**tl;dr**: use [`spring-cloud-vault`][spring-vault-site] to replace long-lived datasource credentials with  dynamic secrets from Vault.
<!-- You can read along at https://github.com/rptcloud/spring-cloud-vault-demo -->

Suppose you have an existing Spring Boot application that talks to a MySQL database.

<!-- https://github.com/rptcloud/spring-cloud-vault-demo/commit/d9c7946157802190b8711feedeb977404dcab8fd -->

First, set up a Vault instance for local development using `docker compose`:

<details open><summary><code>compose.yaml</code></summary>

```diff
--- a/compose.yaml
+++ b/compose.yaml
@@ -11,6 +11,33 @@ services: # listed roughly by boot order
+  vault:
+    image: docker.io/hashicorp/vault:latest
+    cap_add: [IPC_LOCK]
+    # ^ see https://man7.org/linux/man-pages/man7/capabilities.7.html#:~:text=the%20calling%20process.-,cap_ipc_lock,-%E2%80%A2%20%20Lock%20memory%20(mlock
+    ports: ["8200:8200"]
+    environment:
+      - VAULT_DEV_ROOT_TOKEN_ID=my-vault-root-token
+      - VAULT_DEV_LISTEN_ADDRESS=0.0.0.0:8200
+    command: server -dev
+    healthcheck:
+      test: [CMD, vault, status, "-address=http://0.0.0.0:8200"]
+      interval: 2s
+      timeout: 30s
+      retries: 10
+      start_period: 1s
+  vault-init:
+    image: docker.io/hashicorp/vault:latest
+    depends_on: 
+      vault: {condition: service_healthy}
+      mysql: {condition: service_healthy}
+    environment:
+      - MYSQL_ROOT_PASSWORD=my_password
+      - VAULT_TOKEN=my-vault-root-token
+      - VAULT_ADDR=http://vault:8200
+    volumes:
+      - ./scripts/vault-init.sh:/vault-init.sh
+    command: sh /vault-init.sh
   app:
     build: .
     ports: [ "8080:8080" ]
```
</details>

Then add a script to [configure the MySQL secrets engine in Vault][vault-mysql] using Vault's built-in database credential management plugins:

<details open><summary><code>scripts/vault-init.sh</code></summary>

```sh
#!/bin/sh
set -u # fail on any reference to an undefined variable
set -e # fail on any unhandled nonzero return code

# see https://developer.hashicorp.com/vault/docs/secrets/databases/mysql-maria
vault secrets enable database

DB_NAME=my-mysql-database
# ^ this only affects the path of the database configuration in Vault;
# it doesn't have to match the database name
ROLE_NAME="my_role"

vault write database/config/$DB_NAME \
    plugin_name=mysql-database-plugin \
    connection_url="{{username}}:{{password}}@tcp(mysql:3306)/" \
    allowed_roles=$ROLE_NAME \
    username="root" \
    password="$MYSQL_ROOT_PASSWORD"

vault write database/roles/$ROLE_NAME \
    db_name=$DB_NAME \
    creation_statements="
      CREATE USER '{{name}}'@'%' IDENTIFIED BY '{{password}}';
      GRANT ALL ON *.* TO '{{name}}'@'%';
    " \
    default_ttl="30s" # short to demonstrate lease renewal
```

</details>

Note that this Vault database role has no `max_ttl` so that `spring-cloud-vault` can refresh its dynamic database credentials indefinitely.

<!-- https://github.com/rptcloud/spring-cloud-vault-demo/commit/f8537658836bf0945be57c8cc68e8ec8433f814a -->

Next, add `spring-cloud-vault` to your dependencies:

<details open><summary><code>pom.xml</code></summary>

```diff
--- a/pom.xml
+++ b/pom.xml
@@ -51,6 +51,21 @@
       <artifactId>spring-boot-starter-test</artifactId>
       <scope>test</scope>
     </dependency>
+    <dependency>
+      <groupId>org.springframework.cloud</groupId>
+      <artifactId>spring-cloud-starter-vault-config</artifactId>
+      <version>4.2.0</version>
+    </dependency>
+    <dependency>
+      <groupId>org.springframework.vault</groupId>
+      <artifactId>spring-vault-core</artifactId>
+      <version>3.1.1</version>
+    </dependency>
+    <dependency>
+      <groupId>org.springframework.cloud</groupId>
+      <artifactId>spring-cloud-vault-config-databases</artifactId>
+      <version>4.2.0</version>
+    </dependency>
     <dependency>
       <groupId>com.mysql</groupId>
       <artifactId>mysql-connector-j</artifactId>
```

</details>

Finally, we can replace the long-lived credentials in our `application.yml` with dynamic secrets:

<details open><summary><code>config/application.yaml</code></summary>

```diff
--- a/config/application.yaml
+++ b/config/application.yaml
@@ -6,5 +6,27 @@ spring:
       # when the server first boots.
   datasource:
     url: jdbc:mysql://mysql:3306/my_db
-    username: root
-    password: my_password
+  cloud:
+    vault:
+      token: ${VAULT_TOKEN}
+      fail-fast: true # interrupt boot if Spring can't connect to Vault
+      uri: ${SPRING_CLOUD_VAULT_URI:http://vault:8200}
+      database:
+        # see https://cloud.spring.io/spring-cloud-vault/reference/html/#vault.config.backends.database
+        enabled: true
+        role: my_role # this is the name of the database role **in vault**. SHOULD correspond to database/roles/my-role
+        backend: database
+        username-property: "spring.datasource.username"
+        password-property: "spring.datasource.password"
+  config:
+    import: "vault://"
```
</details>

Arguably, the most important line property here is `spring.config.import=vault://`.
That line mounts Vault as a `PropertySource` that uses the backends configured under `spring.config.vault` (for more information, see the [spring cloud vault docs][spring.config.import]).
If you configure everything else correctly but don't include this property, you'll use the wrong username/password for the datasource!

This means our `app` service needs to boot after Vault is online and configured.
Also, in this demo, the Spring Boot app needs a `$VAULT_TOKEN` to authenticate:

<details open><summary><code>compose.yaml</code></summary>

```diff
--- a/compose.yaml
+++ b/compose.yaml
@@ -43,9 +42,11 @@ services: # listed roughly by boot order
   app:
     build: .
     ports: [ "8080:8080" ]
     depends_on: 
       mysql: {condition: service_healthy}
+      vault: {condition: service_healthy}
+      vault-init: {condition: service_completed_successfully}
+    environment:
+      - VAULT_TOKEN=my-vault-root-token
     volumes:
       - ./config/application.yaml:/opt/app/config/application.yaml:ro
       # mount an external config file in a location that Spring Boot will check
       # see https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.files
```

</details>

<aside>

(This example uses the Vault root token that we configured when setting up Vault.
In anything more than a demo you should probably use one of Vault's many supported [authentication methods][vault-auth-methods] to use identity providers such as AWS, Azure, or Kubernetes to authenticate to Vault.)

</aside>


Now if you start your app, it should successfully initialize:
```sh
docker compose up -d --build app
docker compose logs app
```
<details open><summary>output</summary>

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/

 :: Spring Boot ::                (v3.4.3)

YYYY-MM-DDThh:mm:ss.000Z  INFO 1 --- [demo] [           main] c.r.demo.DemoApplication                 : Starting DemoApplication v0.0.1-SNAPSHOT using Java 21.0.2 with PID 1 (/opt/app/app.jar started by root in /opt/app)
YYYY-MM-DDThh:mm:ss.001Z  INFO 1 --- [demo] [           main] c.r.demo.DemoApplication                 : No active profile set, falling back to 1 default profile: "default"
YYYY-MM-DDThh:mm:ss.002Z  INFO 1 --- [demo] [           main] o.s.v.c.e.LeaseAwareVaultPropertySource  : Vault location [secret/demo] not resolvable: Not found
...
YYYY-MM-DDThh:mm:ss.015Z  INFO 1 --- [demo] [           main] o.s.o.j.p.SpringPersistenceUnitInfo      : No LoadTimeWeaver setup: ignoring JPA class transformer
YYYY-MM-DDThh:mm:ss.016Z  INFO 1 --- [demo] [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Starting...
YYYY-MM-DDThh:mm:ss.017Z  INFO 1 --- [demo] [           main] com.zaxxer.hikari.pool.HikariPool        : HikariPool-1 - Added connection com.mysql.cj.jdbc.ConnectionImpl@8afce3
YYYY-MM-DDThh:mm:ss.018Z  INFO 1 --- [demo] [           main] com.zaxxer.hikari.HikariDataSource       : HikariPool-1 - Start completed.
YYYY-MM-DDThh:mm:ss.019Z  INFO 1 --- [demo] [           main] org.hibernate.orm.connections.pooling    : HHH10001005: Database info:
	Database JDBC URL [Connecting through datasource 'HikariDataSource (HikariPool-1)']
...
```

</details>

and performing CRUD operations should result in data landing in your database

<details open><summary>tada 🪄</summary>

```sh
mysql() {
  docker compose exec mysql \
    mysql --user=root --password=my_password my_db \
    -e "$1"
}

mysql 'select count(*) from kvpair;' | sed 's/^/# /g'
# count(*)
# 0

# make an API call to create some data
curl -X POST http://localhost:8080/kv/foo -d value=bar # => bar

# then the data should appear in the database
mysql 'select * from kvpair;' | sed 's/^/# /g'
# k    v
# foo  bar
```

</details>

Note that no additional configuration is required to renew credentials once the TTL is up: [`spring-cloud-vault` renews credential leases automatically][spring-vault-renew-lease].


[vault-lease]: https://developer.hashicorp.com/vault/docs/concepts/lease#lease-durations-and-renewal
[spring-vault-lease]: https://cloud.spring.io/spring-cloud-vault/reference/html/#vault-lease-renewal:~:text=it%20is%20valid.-,Spring%20Cloud%20Vault%20maintains,tokens%20and%20renewable%20leases.,-Secret%20service%20and
[vault]: https://www.vaultproject.io/
[spring-app-prop-locs]: https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.files
[env-vars]: https://docs.spring.io/spring-boot/reference/features/external-config.html#features.external-config.typesafe-configuration-properties.relaxed-binding.environment-variables
[12factor]: https://12factor.net/config
[spring-vault-db-backend]: https://cloud.spring.io/spring-cloud-vault/reference/html/#vault.config.backends.database
[spring-vault-authn]: https://cloud.spring.io/spring-cloud-vault/reference/html/#vault.config.authentication
[vault-authn]: https://developer.hashicorp.com/vault/docs/auth
[spring-vault-repo]: https://github.com/spring-cloud/spring-cloud-vault
[spring-vault-site]: https://cloud.spring.io/spring-cloud-vault/
[vault-lease]: https://developer.hashicorp.com/vault/docs/concepts/lease
[vault-mysql]: https://developer.hashicorp.com/vault/docs/secrets/databases/mysql-maria
[spring.config.import]: https://docs.spring.io/spring-cloud-vault/reference/quickstart.html#:~:text=spring.config.import%20mounts%20vault%20as%20propertysource%20using%20all%20enabled%20secret%20backends%20(key-value%20enabled%20by%20default)
[spring-vault-renew-lease]: https://cloud.spring.io/spring-cloud-vault/reference/html/#:~:text=lease%20renewal%20and%20revocation%20is%20enabled%20by%20default
[vault-auth-methods]: https://developer.hashicorp.com/vault/docs/auth#:~:text=in%20most%20cases%2C%20vault%20will%20delegate%20the%20authentication%20administration%20and%20decision%20to%20the%20relevant%20configured%20external%20auth%20method%20(e.g.%2C%20amazon%20web%20services%2C%20github%2C%20google%20cloud%20platform%2C%20kubernetes%2C%20microsoft%20azure%2C%20okta%20...)

<!-- If a hacker manages to get access to your server and read the server's configuration file or environment variables, you've got other problems.
You can get pretty far tracking of your server's database credentials in a password manager like [`bitwarden`][bitwarden] or [`SOPS`][sops].
When you need to rotate your database credentials, you

[^1]: Using environment variables isn't much more secure than using a configuration file, though. An environment variable is only readable by its owner and root. You could use filesystem permissions to lock down which users can read the file, too. a user who could read the server configuration file could probably still read the environment variables from `/proc/$server_pid/environ`.
-->
