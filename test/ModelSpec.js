/**
 * Test dependencies
 */

var cwd = process.cwd()
  , path = require('path')
  , chai = require('chai')
  , validate = require(path.join(cwd, 'lib/validate'))
  , Model = require(path.join(cwd, 'lib/Model'))
  , Backend = require(path.join(cwd, 'lib/Backend'))  
  , expect = chai.expect
  ;


/**
 * Should style assertions
 */

chai.should();


/**
 * Spec
 */

describe('Model-extending constructor', function () {


  var Type, SubType, instance, validation, err;


  describe('...', function () {

    before(function () {
      Model.prototype.override = 'change me';
      Model.override = 'change me';
      Type = Model.extend({
        x: 1,
        override: 'changed'
      }, {
        x: 1,
        override: 'changed',
        schema: {}
      });
      instance = new Type();
    });

    it('should be extendable', function () {
      SubType = Type.extend();
      instance = new SubType();
      (instance instanceof SubType).should.equal(true);
      (instance instanceof Type).should.equal(true);
    });

    it('should set new prototype properties', function () {
      instance.x.should.equal(1);
    });
    
    it('should override prototype properties', function () {
      instance.override.should.equal('changed');
    });

    it('should set new static properties', function () {
      Type.x.should.equal(1);
    });

    it('should override static properties', function () {
      Type.override.should.equal('changed');
    });

    it('should have default static properties', function () {
      Type.timestamps.should.equal(true);
      Type.uniqueID.should.equal('_id');
    });

    it('should require a schema', function () {
      expect(function () { Model.extend() }).to.throw(Model.UndefinedSchemaError);
    });

    it('should initialize a default backend', function () {
      expect(Type.backend instanceof Backend).equals(true);
    });    

  });


  describe('prototype', function () {

    before(function () {
      Type = Model.extend(null, { schema: {} });
    });

    it('should reference the correct constructor', function () {
      Type.prototype.constructor.should.equal(Type);
    });

  });


  describe('superclass', function () {
    
    before(function () {
      Type = Model.extend(null, { schema: {} });
    });

    it('should reference the correct prototype', function () {
      Type.superclass.should.equal(Model.prototype);
    });

  });


  describe('schema', function () {

    before(function () {
      Type = Model.extend(null, { schema: {} });
    });

    it('should have _id by default', function () {
      Type.schema._id.type.should.equal('any');
    });

    it('should have "created" timestamp by default', function () {
      Type.schema.created.type.should.equal('any');
    });

    it('should have "modified" timestamp by default', function () {
      Type.schema.modified.type.should.equal('any');
    });

  });


  describe('instance', function () {

    before(function () {
      Type = Model.extend(null, { schema: {} });
      instance = new Type();
    });

    it('should be an instance of its constructor', function () {
      (instance instanceof Type).should.equal(true);
    });

    it('should be an instance of Model', function () {
      (instance instanceof Model).should.equal(true);
    });

  });


  describe('instance initialization', function () {

    before(function () {
      Type = Model.extend(null, {
        schema: {
          _id:  { type: 'string' },
          x: { type: 'string' },
          y: {
            properties: {
              z: { type: 'number' },
              d: { type: 'boolean', default: true }
            }
          },
          z: { type: 'boolean', default: true },
          f: { type: 'string', default: function () { return 'generated'; } }
        }
      });
    });

    it('should initialize id if none is provided', function () {
      instance = new Type();
      (typeof instance._id).should.equal('string');

      instance = new Type({});
      (typeof instance._id).should.equal('string');
    });

    it('should not override a provided id', function () {
      var id = '9876rewq';
      instance = new Type({ _id: id });
      instance._id.should.equal(id);
    });

    it('should not initialize id if uniqueID is false', function () {
      NoID = Model.extend(null, {schema:{}})
      NoID.uniqueID = false;
      expect((new NoID)._id).equals(undefined);
    });

    it('should initialize non-default uniqueID', function () {
      OtherID = Model.extend(null, { 
        schema: { other: {type: 'string' } },
        uniqueID: 'other'
      });
      new OtherID().other.should.be.defined;
    });

    it('should set attrs defined in schema', function () {
      instance = new Type({
        x:   'x',
        y:   {
          z: 1
        }
      });

      instance.x.should.equal('x');
      instance.y.z.should.equal(1);
    });

    it('should ignore attrs not defined in schema', function () {
      instance = new Type({ hacker: 'p0wn3d' });
      expect(instance.hacker).equals(undefined);
    });

    it('should set defaults defined in the schema', function () {
      instance = new Type();
      instance.z.should.equal(true);
      instance.y.d.should.equal(true);
    });

    it('should generate defaults defined in the schema by function', function () {
      instance = new Type();
      instance.f.should.equal('generated');
    });

  });


  describe('default', function () {

    before(function () {
      Type = Model.extend(null, {
        schema: {
          random: { type: 'string', default: Type.defaults.random }
        }
      });
    });

    describe('random string generator', function () {

      before(function () {
        instance = new Type();
      });

      it('should set a random string', function () {
        instance.random.should.be.defined;
      });

    });

  });


  describe('instance validation', function () {

    before(function () {
      Type = Model.extend(null, {
        schema: {
          email:  { type: 'string', format: 'email' },
          random: { type: 'string' }
        }
      });

      Type.before('validate', function () {
        this.random = 'zxcv';
      });

    });

    describe('with valid data', function () {
      
      before(function () {
        instance = new Type({ email: 'valid@example.com' });
        validation = instance.validate();
      });

      it('should be valid', function () {
        validation.valid.should.equal(true);
      });

    });

    describe('with invalid data', function () {

      before(function () {
        instance = new Type({ email: 'not-valid' });
        validation = instance.validate();
      });

      it('should not be valid', function () {
        validation.valid.should.equal(false);
      });

      it('should return a ValidationError', function () {
        (validation instanceof validate.ValidationError).should.equal(true);
      });

    });

    describe('with before validate hook', function () {

      before(function (done) {
        Type.backend.reset();
        Type.create({ email: 'valid@email.com' }, function (error, _instance) {
          err = error;
          instance = _instance;
          done();
        });         
      });

      it('should invoke the callback', function () {
        instance.random.should.equal('zxcv');
      });

    });


  });


  describe('instance creation', function () {

    before(function () {
      Type = Model.extend(null, {
        schema: {
          email:  { type: 'string', format: 'email' },
          random: { type: 'string' }
        }
      });

      Type.before('create', function () {
        this.random = 'zxcv';
      });
    });

    describe('with valid data', function () {

      before(function (done) {
        Type.backend.reset();
        Type.create({ email: 'valid@email.com' }, function (error, _instance) {
          err = error;
          instance = _instance;
          done();
        }); 
      });

      it('should provide a null error', function () {
        expect(err).equals(null);
      });

      it('should provide an instance', function () {
        (instance instanceof Type).should.equal(true);
      });

      it('should set the "created" timestamp', function () {
        instance.created.should.be.defined;
      });

      it('should set the "modified" timestamp', function () {
        instance.modified.should.be.defined;
      });

      it('should be saved to the backend', function () {
        Type.backend.documents[0].created.should.equal(instance.created);
      });

    });

    describe('with invalid data', function () {

      before(function (done) {
        Type.backend.reset();
        Type.create({ email: 'not-valid' }, function (error, _instance) {
          err = error;
          instance = _instance;
          done();
        }); 
      });

      it('should provide a validation error', function () {
        err.name.should.equal('ValidationError');
      });

      it('should not provide an instance', function () {
        expect(instance).equals(undefined);
      });

    });

    describe('with a duplicate values on unique attributes', function () {
      it('should provide a "duplicate value" error');
    });

    describe('with before create hook', function () {

      before(function (done) {
        Type.backend.reset();
        Type.create({ email: 'valid@email.com' }, function (error, _instance) {
          err = error;
          instance = _instance;
          done();
        });         
      });

      it('should invoke the callback', function () {
        instance.random.should.equal('zxcv');
      });

    });

  });


  describe('instance retrieval', function () {

    before(function () {
      Type = Model.extend(null, {
        schema: {
          email: { type: 'string', format: 'email' }
        }
      });
    });

    describe('by attribute', function () {

      before(function (done) {
        var data = { email: 'valid@example.com' };
        Type.create(data, function (e, type) {
          Type.find({ email: data.email }, function (error, _instance) {
            err = error;
            instance = _instance;
            done();
          });
        });        
      });

      it('should provide a null error', function () {
        expect(err).equals(null);
      })

      it('should provide an instance', function () {
        (instance instanceof Type).should.equal(true);
      });

    });

  });


  describe('instance updates', function () {

    before(function () {
      Type = Model.extend(null, {
        schema: {
          email: { type: 'string', format: 'email' }
        }
      });
    });

    describe('with valid data', function () {

      before(function (done) {
        Type.backend.reset();
        Type.create({ email: 'initial@email.com' }, function (e, type) {
          Type.update({ _id: type._id }, { email: 'updated@email.com' }, function (error, _instance) {
            err = error;
            instance = _instance;
            done();
          });
        }); 
      });

      it('should provide a null error', function () {
        expect(err).equals(null);
      });

      it('should provide an updated instance', function () {
        instance.email.should.equal('updated@email.com');
      });

      it('should store the updated instance', function () {
        Type.backend.documents[0].email.should.equal('updated@email.com');
      });

      it('should update the timestamp', function () {
        instance.modified.should.not.equal(instance.created);
      });

    });

    describe('with invalid data', function () {

      before(function (done) {
        Type.backend.reset();
        Type.create({ email: 'initial@email.com' }, function (e, type) {
          Type.update({ _id: type._id}, { email: 'not-valid' }, function (error, _instance) {
            err = error;
            instance = _instance;
            done();
          });
        }); 
      });

      it('should provide a validation error', function () {
        err.name.should.equal('ValidationError');
      });

      it('should not provide an instance', function () {
        expect(instance).equals(undefined);
      });

    });

  });


  describe('instance destruction', function () {

    describe('with existing instance', function () {

      before(function (done) {
        Type.backend.reset();
        Type.create({ email: 'initial@email.com' }, function (e, type) {
          Type.backend.documents.length.should.equal(1);

          Type.destroy({ _id: type._id}, function (error) {
            err = error;
            done();
          });
        }); 
      });

      it('should provide a null error', function () {
        expect(err).equals(null);
      });

      it('should delete the stored instance', function () {
        Type.backend.documents.length.should.equal(0);
      });

    });

  });

});