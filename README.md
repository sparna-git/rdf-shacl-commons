# rdf-shacl-commons
An RDF and SHACL typescript utility package


### To package

```
npm run build
npm pack
```

Then on Sparnatural side:

```
npm install ../rdf-shacl-commons/rdf-shacl-commons-0.2.0.tgz
```

### Find circular dependencies

See [madge](https://github.com/pahen/madge)

```sh
npx madge --circular --extensions ts src
``` 