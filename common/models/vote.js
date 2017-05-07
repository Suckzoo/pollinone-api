'use strict';
const randomstring = require('randomstring');
const moment = require('moment');

module.exports = function(Vote) {
  Vote.createVote = (title, itemCount, cb) => {
    let key, rootCredential;
    key = randomstring.generate(20);
    rootCredential = randomstring.generate(10);
    title = title || `Vote created at ${moment().format('YYYY-MM-DD HH:mm')}`;
    itemCount = itemCount || 2;
    return Vote.create({
      title,
      itemCount,
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
    accepts: [{
      arg: 'title',
      type: 'string',
    }, {
      arg: 'itemCount',
      type: 'number',
    }],
    returns: {
      root: true,
    },
    http: {
      verb: 'post',
    },
  });

  Vote.start = (id, rootCredential, cb) => {
    _findVoteAsRoot(id, rootCredential).then(vote => {
      if (vote.status !== 'init') {
        throw 'already started vote';
      }
      vote.status = 'voting';
      return Vote.upsert(vote);
    }).then(vote => {
      cb(null, vote);
    }).catch(err => {
      cb(err);
    });
  };

  Vote.remoteMethod('start', {
    accepts: [{
      arg: 'id',
      type: 'number',
      required: true,
    }, {
      arg: 'rootCredential',
      type: 'string',
      required: true,
    }],
    returns: {
      root: true
    },
    http: {
      verb: 'get',
      path: '/start/:id',
    },
  });

  Vote.join = (id, key, cb) => {
    Vote.findOne({
      where: {
        id,
        key,
      },
    }).then(vote => {
      if (!vote) {
        throw 'no vote room available';
      }
      if (vote.status !== 'init') {
        throw 'user is not allowed to join this vote';
      }
      return Vote.app.models.Member.create({
        credential: randomstring.generate(20),
        item: null,
        vote,
      });
    }).then(member => {
      cb(null, member);
    }).catch(err => {
      cb(err);
    });
  };

  Vote.remoteMethod('join', {
    accepts: [{
      arg: 'id',
      type: 'number',
    }, {
      arg: 'key',
      type: 'string',
    }],
    returns: {
      root: true,
    },
    http: {
      verb: 'get',
      path: '/join/:id',
    },
  });

  Vote.collect = (id, rootCredential, cb) => {
    _findVoteAsRoot(id, rootCredential).then(vote => {
      vote.currentItem++;
      if (vote.currentItem === vote.itemCount) {
        vote.status = 'finished';
      }
      return Vote.upsert(vote);
    }).then(vote => {
      cb(null, vote);
    }).catch(err => {
      cb(err);
    });
  };

  Vote.remoteMethod('collect', {
    accepts: [{
      arg: 'id',
      type: 'number',
      required: true,
    }, {
      arg: 'rootCredential',
      type: 'string',
      required: true,
    }],
    returns: {
      root: true,
    },
    http: {
      verb: 'get',
      path: '/collect/:id',
    },
  });

  Vote.close = (id, rootCredential, cb) => {
    let result = [];
    let vote = null;
    _findVoteAsRoot(id, rootCredential).then(_vote => {
      vote = _vote;
      if (vote.status !== 'finished') {
        throw 'vote not finished';
      }
      return Promise.all(Array.from(Array(vote.itemCount).keys()).map(item => (
        Vote.app.models.Member.count({
          where: {
            voteId: id,
            item: item,
          },
        }))
      ));
    }).then(_result => {
      result = _result;
      vote.status = 'closed';
      return Vote.upsert(vote);
    }).then(() => {
      cb(null, result);
    }).catch(err => {
      cb(err);
    });
  };

  Vote.remoteMethod('close', {
    accepts: [{
      arg: 'id',
      type: 'number',
      required: true,
    }, {
      arg: 'rootCredential',
      type: 'string',
      required: true,
    }],
    returns: {
      root: true,
    },
    http: {
      verb: 'get',
      path: '/close/:id',
    },
  });

  function _findVoteAsRoot(id, rootCredential) {
    return Vote.findOne({
      where: {
        id,
        rootCredential,
      },
    }).then(vote => {
      if (!vote) {
        throw 'vote instance not found';
      }
      return vote;
    });
  }
};
