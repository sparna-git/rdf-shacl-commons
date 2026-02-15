# How to publish on NPM ?

1. Make sure local repository is uptodate and on branch master
2. Increment version number in package.json
3. Commit and push
4. Compile with `npm run build`
5. login with `npm login`
6. Publish with `npm publish` (OTP on Microsoft Authenticator)
7. Check at https://www.npmjs.com/package/rdf-shacl-commons
8. Create release on Github project
9. Write release note by checking the issues that were closed since last release (https://github.com/sparna-git/rdf-shacl-commons/issues?q=is%3Aclosed+sort%3Aupdated-desc)