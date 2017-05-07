'use strict';

module.exports = function(Member) {
  Member.vote = (id, credential, cb) => {
    Member.findOne({
      where: {
        voteId: id,
        credential,
      },
      include: 'vote',
    }).then(member => {
      if (!member) {
        throw 'invalid membership';
      }
      member = member.toJSON();
      let vote = member.vote;
      if (vote.status !== 'start') {
        throw 'currently not voting';
      }
      let item = vote.currentItem;
      member.item = item;
      return Member.upsert(member);
    }).then(member => {
      cb(null, {
        item: member.item,
        credential: member.credential,
      });
    }).catch(err => {
      cb(err);
    });
  };

  Member.remoteMethod('vote', {
    accepts: [{
      arg: 'id',
      type: 'number',
      required: true,
    }, {
      arg: 'credential',
      type: 'string',
      required: true,
    }],
    returns: {
      root: true,
    },
    http: {
      verb: 'get',
      path: '/vote/:id',
    },
  });

  Member.withdraw = (id, credential, cb) => {
    Member.findOne({
      voteId: id,
      credential,
    }).then(member => {
      if (!member) {
        throw 'no membership found';
      }
      member.item = null;
      return Member.upsert(member);
    }).then(() => {
      cb(null, {success: true});
    }).catch(err => {
      cb(err);
    });
  };

  Member.remoteMethod('withdraw', {
    accepts: [{
      arg: 'id',
      type: 'number',
      required: true,
    }, {
      arg: 'credential',
      type: 'string',
      required: true,
    }],
    returns: {
      root: true,
    },
    http: {
      verb: 'delete',
      path: '/vote/:id',
    },
  })
};
