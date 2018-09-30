/* global beforeEach, describe, expect, test */

const { HubspotCompanyCache } = require('./index.js');
const Hubspot = require('hubspot');

describe('company cache', () => {
  let hspot;

  beforeEach(() => {
    hspot = new Hubspot();
  });

  test('create', () => {
    var cache = new HubspotCompanyCache(hspot);
    expect(cache).not.toBeNull();
  });
});
