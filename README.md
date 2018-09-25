Hubspot Company Cache
=====================

Hubspot has a spotty (heh) API which has some missing pieces.
One of the worse is the ability to search companies without
download them all.  This is
[https://integrate.hubspot.com/t/search-for-companies-by-name/3024](documented)
on their forum.

They do have API for getting recently created and recently modified
companies.  These can be used for maintaining a cache of companies.
I wrote one of these that due to complexity issues I didn't end up
using.  Our primary use was to reduce the duplication of companies
by name.  But instead we decided to manage those manually.  This code
is for people who still need to do searching locally.

In order to use this code first install it

```yarn add hubspot-company-cache```

This package assumes you have a hubspot object from
[https://github.com/brainflake/node-hubspot](node-hubspot)
that you can inject into it.  We will call this ```hspot```
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
it will your first call will block until it is done filling the
cache.

You can use this to find companies by name like this:

```
companyCaches to find companies by name like this:

```
companyCache.findCompanyInCache('My Company');
```

The current cache policy is to try to fill when there is
a miss.  There is not attempt to update companies once
they are fetched.

At the moment I've just save code that I've ripped
out of another codebase and placed it here.  I won't
even claim it really works at the moment.

Thus the API isn't stable in any sense of the word.

Work to be done before this is something I
would use includes

1. Stable API
1. Tests
1. An interface to iterate over the cache (search other then name)
1. Remove the few bits of lodash use to reduce weight.
1. Remove dependence on https://github.com/brainflake/node-hubspot
  ( Note that I like this API, just a lot to drag in.)
