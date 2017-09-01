import {moduleFor, test} from 'ember-qunit';

moduleFor('controller:application', 'Unit | Controller | application', {
    needs: [
        'service:metrics',
        'service:session',
        'service:theme',
        'service:toast',
    ]
});

test('it exists', function (assert) {
    const controller = this.subject();

    assert.ok(controller);
});
