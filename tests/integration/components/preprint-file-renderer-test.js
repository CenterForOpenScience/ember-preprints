import { A } from '@ember/array';
import RSVP, { resolve } from 'rsvp';
import { moduleForComponent, test } from 'ember-qunit';
import Service from '@ember/service';
import ArrayProxy from '@ember/array/proxy';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';

const themeStub = Service.extend({
    isProvider: true,
    provider: RSVP.resolve(EmberObject.create({
        name: 'OSF',
        allowCommenting: false,
        additionalProviders: ['Other Provider'],
    })),
});
moduleForComponent('preprint-file-renderer', 'Integration | Component | preprint file renderer', {
    integration: true,
    beforeEach() {
        const fileVersions = () => resolve(ArrayProxy.create({
            content: A([
                EmberObject.create({ size: 4, dateCreated: new Date('05 October 2011 14:48 UTC') }),
                EmberObject.create({ size: 5, dateCreated: new Date('05 October 2011 14:49 UTC') }),
            ]),
            meta: {
                pagination: {
                    total: 1,
                },
            },
        }));
        const providerFiles = () => resolve(ArrayProxy.create({
            content: A([
                EmberObject.create({
                    id: 345, name: 'test folder', kind: 'folder',
                }),
                EmberObject.create({ id: 350, name: 'chosenFile', kind: 'file' }),
            ]),
            meta: {
                pagination: {
                    total: 3,
                },
            },
        }));
        const providersQuery = resolve(A([{
            name: 'osfstorage',
            queryHasMany: providerFiles,
        }]));
        const file = EmberObject.create({
            name: 'test file',
            currentVersion: '1.12',
            id: 890,
            queryHasMany: fileVersions,
            links: { download: '/link/to/download/url' },
        });
        const preprint = EmberObject.create({
            primaryFile: file,
            dateModified: '10-11-2016',
            title: 'My Preprint Title',
            files: providersQuery,
            provider: 'osf',
            id: 890,
        });
        const trackNonContributors = () => {};
        this.register('service:theme', themeStub);
        this.inject.service('theme');
        this.set('preprint', preprint);
        this.set('versions', fileVersions);
        this.set('primaryFile', file);
        this.set('trackNonContributors', trackNonContributors);
    },
});

test('it renders', function(assert) {
// Tests that the page renders
    this.render(hbs`{{preprint-file-renderer
        preprint=preprint
        primaryFile=primaryFile
        versions=versions
        trackNonContributors=(action trackNonContributors)
    }}`);
    assert.equal(this.$('.osf-box').length, 0);
    assert.equal(this.$('#selectedFileName').text(), 'test file');
    assert.equal(this.$('#currentVersion').text(), 'Version: 1.12');
});

test('primary file versions exist', function(assert) {
    this.set('versions', A([
        EmberObject.create({ id: 2, size: 4, dateCreated: new Date('05 October 2011 14:48 UTC') }),
        EmberObject.create({ id: 1, size: 5, dateCreated: new Date('05 October 2011 14:49 UTC') }),
    ]));
    this.render(hbs`{{preprint-file-renderer
        preprint=preprint
        primaryFile=primaryFile
        versions=versions
        trackNonContributors=(action trackNonContributors)
    }}`);
    assert.ok($('a.dropdown-toggle')[0].innerText.includes('Download previous versions'));
    assert.ok($('a.dropdown-item')[0].innerText.includes('Version 2'));
    assert.ok($('a.dropdown-item')[1].innerText.includes('Version 1'));
});

test('primary file one version', function(assert) {
    this.set('versions', A([]));
    this.render(hbs`{{preprint-file-renderer
        preprint=preprint
        primaryFile=primaryFile
        versions=versions
        trackNonContributors=(action trackNonContributors)
    }}`);
    assert.notOk($('a.dropdown-toggle')[0]);
});
