.PHONY: post dev-server
post:
	bash -c "touch ./content/_posts/$(date -I)-$(title)";
dev-server:
	./scripts/serve.sh
