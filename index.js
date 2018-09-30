const _ = require('lodash');

/*
 * We need to be able to search hubspot companies to do some de-duping.
 * Unfortunately the hubspot API assumes that you only want to do that
 * by domain which we don't always have (and I would guess that there
 * could be chains which used the same domain?).
 *
 * The intent of this class is to store the list of
 * companies, allow for it to be searched, and try to keep it up
 * to date through an endpoint which allows us to get companies
 * in reverse chronological order.
 */
class HubspotCompanyCache {
  constructor (hspot, opts = {}) {
    this.companyCachePromise = null;
    this.companyCache = {};
    this.companyUpdateInProgress = false;
    this.companyLastUpdate = null;
    this.hspot = hspot;

    if (!opts.dontSchedule) {
      this.updateProcess = setInterval(() => {
        this.update();
      }, 5 * 60 * 1000);
    }
  }

  /*
   * Since Javascript has not way of cleaning up after
   * objects other then completely GCng them we provide
   * an interface for cleaning up internal resources that
   * might nto be GC'd.
   */
  destroy () {
    if (this.updateProcess) {
      clearInterval(this.updateProcess);
    }
  }

  // Helper function for retrieving hubspot properties.
  static getPropValue (obj, propName, defaultValue = undefined) {
    return _.get(_.get(obj.properties, propName, {}), 'value', defaultValue);
  }

  // Public iterator interface.
  [Symbol.iterator] () {
    return {
      // Fix the keys we iterate over.
      keys: Object.keys(this.companyCache),
      parent: this,
      next () {
        let nextValue;
        do {
          nextValue = this.parent.companyCache[this.keys.pop()];
        } while (!nextValue && this.keys.length >= 1);
        return {
          done: this.keys.length === 0,
          value: nextValue
        }
      }
    }
  }

  // private utility function
  putCompanyInCache (company) {
    this.companyCache[company.companyId] = company;
  }

  // No-op if it has already been called
  // Can be used publically to kick off filling cache.
  fill () {
    if (!this.companyCachePromise) {
      this.companyCachePromise = new Promise(async (resolve) => {
        let hubspotRV;
        let maxCreatedDate = 0;
        const opts = { properties: ['createdate', 'environment', 'name'] };
        do {
          hubspotRV = await this.hspot.companies.get(opts);
          hubspotRV.companies.forEach(company => this.putCompanyInCache(company));
          maxCreatedDate = Math.max(
            maxCreatedDate,
            Math.max(...hubspotRV.companies.map(
              company => HubspotCompanyCache.getPropValue(company, 'createdate', 0)))
          );
          opts.offset = hubspotRV.offset;
        } while (hubspotRV['has-more']);
        this.companyLastUpdate = maxCreatedDate;
        resolve(this.companyCache);
      });
    }
    return this.companyCachePromise;
  }

  // Execute at a regular interval to update the cache.
  async update () {
    await this.fill(); // in case this hasn't happened yet
    if (this.companyUpdateInProgress) {
      // return if an update is already happening.
      return false;
    }

    // Grab our indicator that we are updating
    this.companyUpdateInProgress = true;

    let hubspotRV;
    let newUpdate;
    const futureDate = (new Date()).getTime() + (24 * 60 * 60 * 1000);
    const opts = { properties: ['createdate', 'environment', 'name'] };
    do {
      hubspotRV = await this.hspot.companies.getRecentlyModified(opts);
      hubspotRV.results.forEach(company => this.putCompanyInCache(company));
      opts.offset = hubspotRV.offset;
      newUpdate = newUpdate ||
        HubspotCompanyCache.getPropValue(hubspotRV.results[0], 'createdate', null);
    } while (hubspotRV['has-more'] &&
      HubspotCompanyCache.getPropValue(
        hubspotRV.results[hubspotRV.results.length - 1],
        'createdate',
        futureDate) > this.companyLastUpdate
    );
    this.companyLastUpdate = newUpdate;

    // release our indicator that we are updating
    this.companyUpdateInProgress = false;

    return true;
  }
}

module.exports = {
  HubspotCompanyCache
};
