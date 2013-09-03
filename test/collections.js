var Collections = require('../lib/collections');

var EventEmitter = require('events').EventEmitter,
    assert       = require('assert');

describe('collections', function () {
    var requests = new EventEmitter();

    var request = function (object, callback) {
        requests.emit('request', object);
        requestCallback(object, callback);
    };

    var object = { metadata: { guid: 1 }};

    var requestCallback,
        collectionName = 'collection',
        factory    = new Collections(request),
        collection = factory.create(collectionName,
            { name: { type: 'string' }}, [ 'inner1', 'inner2' ]);

    describe('get', function () {
        it('get multiple', function (done) {
            requests.once('request', function (object) {
                assert.deepEqual(object, {
                    endpoint: collectionName,
                    page:     1,
                    method:   'GET'
                });

                done();
            });

            requestCallback = function (object_, callback) {
                callback(null, [ object ]);
            };

            collection.get(function (err, result) {
                assert(! err, err);
                assert.deepEqual(Object.select(result[0], 'metadata'), object);
            });
        });

        describe('single', function () {
            var result;

            requestCallback = function (object_, callback) {
                callback(null, object);
            };

            it('get', function (done) {
                requests.once('request', function (object) {
                    assert.deepEqual(object, {
                        endpoint: collectionName + '/1',
                        page:     null,
                        method:   'GET'
                    });

                    done();
                });

                collection.get(1, function (err, result_) {
                    assert(! err, err);
                    result = result_;
                    assert.deepEqual(Object.select(result, 'metadata'), object);
                });
            });

            it('object has inner1.get methods', function (done) {
                requests.once('request', function (object) {
                    assert.deepEqual(object, {
                        endpoint: collectionName + '/1/inner1',
                        method:   'GET'
                    });

                    done();
                });

                result.inner1.get(function (err, results) {
                    assert(! err, err);
                });
            });

            it('object has inner1.put methods', function (done) {
                requests.once('request', function (object) {
                    assert.deepEqual(object, {
                        endpoint: collectionName + '/1/inner1',
                        method:   'PUT',
                        json: { field: 'value' }
                    });

                    done();
                });

                result.inner1.put({ field: 'value' }, function (err, results) {
                    assert(! err, err);
                });
            });
        });
    });

    describe('create', function () {
        it('fails on invalid schema', function (done) {
            collection.create({ name: 1 }, function (err, result_) {
                assert(err);
                assert(/'name' is an integer when it should be a string/
                    .exec(err.message));
                done();
            });
        });

        it('with valid object', function (done) {
            var obj = { name: '1' };

            requests.once('request', function (object) {
                assert.deepEqual(object, {
                    endpoint: collectionName,
                    method:   'POST',
                    json:     obj
                });

                done();
            });

            collection.create(obj, function (err, result_) {
                assert(! err, err);
            });
        });
    });

    describe('delete', function () {
        it('with query', function (done) {
            requests.once('request', function (object) {
                assert.deepEqual(object, {
                    endpoint: collectionName + '/1',
                    method:   'DELETE',
                    query:    { recursive: true }
                });

                done();
            });

            collection.delete(1, true, function (err, result_) {
                assert(! err, err);
            });
        });
    });
});
