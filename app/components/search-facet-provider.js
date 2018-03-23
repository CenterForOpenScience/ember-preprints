import Component from '@ember/component';
import { inject as service } from '@ember/service';
import $ from 'jquery';
import config from 'ember-get-config';
import Analytics from 'ember-osf/mixins/analytics';

const getProvidersPayload = '{"from": 0,"query": {"bool": {"must": {"query_string": {"query": "*"}}, "filter": [{"bool": {"should": [{"terms": {"types": ["preprint"]} },{"terms": {"sources": ["Thesis Commons"]} }]}}]}},"aggregations": {"sources": {"terms": {"field": "sources","size": 200}}}}';


/**
 * @module ember-preprints
 * @submodule components
 */

/**
 * Builds preprint provider facets for discover page - to be used with Ember-OSF's discover-page component and faceted-search component.
 *
 * Sample usage:
 * ```handlebars
 * {{search-facet-provider
 *      updateFilters=(action 'updateFilters')
 *      activeFilters=activeFilters
 *      options=facet
 *      filterReplace=filterReplace
 *      key=key
 * }}
 * ```
 * @class search-facet-provider
 */
export default Component.extend(Analytics, {
    store: service(),
    theme: service(),
    otherProviders: [],
    searchUrl: config.OSF.shareSearchUrl,
    whiteListedProviders: config.whiteListedProviders.map(item => item.toLowerCase()),
    osfUrl: config.OSF.url,

    init() {
        this._super(...arguments);
        Promise.all([
            // The providers list from the API
            this.get('store')
                .findAll('preprint-provider')
                .then((providers) => {
                    const providerNames = providers.filter(provider => provider.get('id') !== 'livedata').map((provider) => {
                        const name = provider.get('shareSource') || provider.get('name');
                        // TODO Change this in populate_preprint_providers script to just OSF
                        return name === 'Open Science Framework' ? 'OSF' : name;
                    });
                    this.set('osfProviders', providerNames);
                    return providerNames;
                }),
            // The providers list from SHARE
            $.ajax({
                type: 'POST',
                url: this.get('searchUrl'),
                data: getProvidersPayload,
                contentType: 'application/json',
                crossDomain: true,
            })
            .then(results => results.aggregations.sources.buckets)
        ])
            .then(([osfProviders, hits]) => {
                // Get the whitelist and add the OSF Providers to it
                const whiteList = this.get('whiteListedProviders')
                    .concat(osfProviders
                        .map(osfProvider => osfProvider.toLowerCase()));
                // Filter out providers that are not on the whitelist
                const providers = hits
                    .filter(hit => whiteList.includes(hit.key.toLowerCase()));

                // Add the OSF Providers that are not in SHARE
                providers.push(...osfProviders
                    .filter(osfProvider => !providers
                        .find(hit => hit.key.toLowerCase() === osfProvider.toLowerCase()))
                    .map(key => ({
                        key,
                        doc_count: 0,
                    })));

                // Sort the providers list add add OSF to the top
                providers
                    .sort((a, b) => (a.key.toLowerCase() < b.key.toLowerCase() ? -1 : 1))
                    .unshift(...providers.splice(
                        providers.findIndex(item => (/^osf/i).test(item.key)),
                        1,
                    ));

                if (!this.get('theme.isProvider')) {
                    this.set('otherProviders', providers);
                } else {
                    const filtered = providers.filter(item => item.key === this.get('theme.provider.name'));

                    this.set('otherProviders', filtered);
                    this.get('activeFilters.providers').pushObject(filtered[0].key);
                }
                this.notifyPropertyChange('otherProviders');
            });
    },
});
