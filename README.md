Hubspot Company Cache
=====================

Hubspot has a spotty (heh) API which has some missing pieces.
One of the worse is the inability to search companies without
download them all.  This is discuess in
[https://integrate.hubspot.com/t/search-for-companies-by-name/3024](documented)
on their forum.

They do have an API for getting recently created and recently modified
companies.  These can be used for maintaining a cache of companies.
I wrote some code to support such a cache but due to complexity I didn't end up
using it.  My primary use was to reduce the duplication of companies
by name.  But instead I decided to do that manually.  This code
is for people who still need to do searching locally.

In order to use this code first install it

```yarn add hubspot-company-cache```

This package assumes you have a hubspot object from
[https://github.com/brainflake/node-hubspot](node-hubspot)
that you can inject into it.  I will call this ```hspot```
throughout the documentation.  Pass this into the
HubspotCompanyCache object thus:

```
import HubspotCompanyCache from 'hubspot-company-cache';
const companyCache = new HubspotCompanyCache(hspot);
```

Early in startup you might want to start the cache loading.

```
companyCache.fill();
```

If it doesn't finishg filling before your first call then
your first call will block until it is done filling the
cache.

You can use this to find companies by name like this:

```
for (const company of companyCache) {
  if (HubspotCompanyCache.getPropValue(company, 'name') === 'My Company') {
    ...
  }
}
```

The current cache policy is to fill when there is
a miss.  There is no attempt to update companies once
they are fetched.

At the moment I've just saved code that I ripped
out of another codebase.  I won't
even claim it really works at the moment.

Thus the API isn't stable in any sense of the word.

Work to be done before this is something I
would use includes

1. Example program.
1. Tests
1. An interface to iterate over the cache (search other then name)
1. An interface to ask for specific properties on object.
1. Stable API
1. Remove the use of lodash use to reduce weight.
1. Abstract cache interface out so that others (e.g. redis) could be substituted.
1. Ability to emit events when changed / new objects are found (==> allow user to keep own search structure).
