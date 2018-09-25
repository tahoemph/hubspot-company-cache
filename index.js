import _ from 'lodash';

// Helper function for retrieving hubspot properties.
function getPropValue(obj, propName, defaultValue = undefined) {
  return _.get(_.get(obj.properties, propName, {}), 'value', defaultValue);
}

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
class CompanyCache {
  constructor(hspot) {
    this.companyCachePromise = null;
    this.companyCache = {};
    this.companyUpdateInProgress = null;
    this.companyLastUpdate = null;
    this.hspot = hspot;
  }

  // Private
  findCompanyInCache(name) {
    return (this.companyCache[name]);
  }

  putCompanyInCache(company) {
    const name = getPropValue(company, 'name');
    if (!this.findCompanyInCache(name)) {
      this.companyCache[name] = company;
    }
  }

  // No-op if it has already been called
  // Can be used publically to kick off filling cache.
  fill() {
    if (!this.companyCachePromise) {
      this.companyCachePromise = new Promise(async (resolve) => {
        let hubspotRV;
        let maxCreatedDate = 0;
        const opts = {properties: ['createdate', 'environment', 'name']};
        do {
          hubspotRV = await this.hspot.companies.get(opts);
          hubspotRV.companies.forEach(company => this.putCompanyInCache(company));
          maxCreatedDate = Math.max(
            maxCreatedDate,
            Math.max(...hubspotRV.companies.map(company => getPropValue(company, 'createdate', 0)))
          );
          opts.offset = hubspotRV.offset;
        } while (hubspotRV['has-more']);
        this.companyLastUpdate = maxCreatedDate;
        resolve(this.companyCache);
      });
    }
    return this.companyCachePromise;
  }

  // private
  async update() {
    if (this.companyUpdateInProgress) {
      // Block if somebody is ready doing this
      // We could optimize and do a search after this
      // but we expect this collision to happen
      // infrequently and the update should be quick.
      await this.companyUpdateInProgress;
    }

    // Grab our indicator that we are updating
    this.companyUpdateInProgress = new Promise(async (resolve) => {
      let hubspotRV;
      let newUpdate;
      const futureDate = (new Date()).getTime() + (24 * 60 * 60 * 1000);
      const opts = {properties: ['createdate', 'environment', 'name']};
      do {
        hubspotRV = await this.hspot.companies.getRecentlyModified(opts);
        hubspotRV.results.forEach(company => this.putCompanyInCache(company));
        opts.offset = hubspotRV.offset;
        newUpdate = newUpdate || getPropValue(hubspotRV.results[0], 'createdate', null);
      } while (hubspotRV['has-more'] &&
        getPropValue(hubspotRV.results[hubspotRV.results.length - 1], 'createdate', futureDate) > this.companyLastUpdate);
      this.companyLastUpdate = newUpdate;
      resolve(this.companyCache);
    });

    return this.companyUpdateInProgress;
  }

  // primary public interface
  async findCompany(name) {
    const this.hspot = await getHubspot();
    await this.fill();

    const company = this.findCompanyInCache(name);
    if (company) {
      return company;
    }

    await this.update();
    return this.findCompanyInCache(name);
  }
}
