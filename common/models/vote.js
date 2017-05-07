'use strict';
const randomstring = require('randomstring');

module.exports = function(Vote) {
  Vote.createVote = cb => {
    let code, key, rootCredential;
    code = randomstring.generate({
      length: 6,
      charset: 'numeric',
    });
    key = randomstring.generate(20);
    rootCredential = randomstring.generate(10);
    Vote.create({
      code,
      key,
      rootCredential,
      status: 'open',
    }).then(vote => {
      cb(null, vote);
    }).catch(err => {
      cb(err);
    });
  };

  Vote.remoteMethod('createVote', {
    returns: [{
      arg: 'code',
      type: 'string',
    }, {
      arg: 'key',
      type: 'string',
    }, {
      arg: 'rootCredential',
      type: 'string',
    }, {
      arg: 'status',
      type: 'string',
    }],
    http: {
      verb: 'post',
    },
  });

  Vote.start = (code, rootCredential, cb) => {
    Vote.findOne({
      where: {
        code,
        rootCredential,
      },
    }).then(vote => {
      if (!vote) {
        throw 'no vote room available';
      }
      vote.status = 'start';
      return Vote.upsert(vote);
    }).then(vote => {
      cb(null, vote);
    }).catch(err => {
      cb(err);
    });
  };

  Vote.remoteMethod('start', {
    accepts: [{
      arg: 'code',
      type: 'string',
    }, {
      arg: 'rootCredential',
      type: 'string',
    }],
    http: {
      verb: 'get',
    },
  });

  Vote.join = cb => {
    
  };

  Vote.remoteMethod('join', {

  });

  Vote.count = cb => {

  };

  Vote.remoteMethod('count', {
    http: {
      verb: 'get',
    },
  });
};
