.PHONY: new-post dev-server all
all: ./assets/syntax-light.css ./assets/syntax-dark.css
new-post:
	./scripts/new_post.sh;
dev-server:
	./scripts/serve.sh

./assets/syntax-light.css:
	hugo gen chromastyles --style=github > ./assets/syntax-light.css
./assets/syntax-dark.css:
	echo "@media (prefers-color-scheme: dark) {" > ./assets/syntax-dark.css
	hugo gen chromastyles --style=github-dark >> ./assets/syntax-dark.css
	echo "}" >> ./assets/syntax-dark.css
