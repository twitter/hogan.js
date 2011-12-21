#
# Run command line tests
#
test:
	@@ node test/index.js

#
# Run Mustache spec tests
#
spec:
	@@ node test/spec.js

#
# Run benchmark
#
benchmark:
	@@ node benchmark/console/index.js


.PHONY: test benchmark