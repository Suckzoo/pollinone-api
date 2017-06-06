'use strict';

module.exports = function(Member) {
  Member.vote = (id, credential, cb) => {
    _findMemberByCredential(id, credential).then(member => {
      let item = member.vote.currentItem;
      member.item = item;
      console.log(member)
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
    _findMemberByCredential(id, credential).then(member => {
      member.item = null;
      console.log(member)
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

  function _findMemberByCredential(id, credential) {
    return Member.findOne({
      where: {
        voteId: id,
        credential,
      },
      include: {
        relation: 'vote',
        scope: {
          fields: ['id', 'status', 'currentItem'],
        }
      }
    }).then(member => {
      if (!member) {
        throw 'invalid membership';
      }
      member = member.toJSON();
      let vote = member.vote;
      if (vote.status !== 'voting') {
        throw 'currently not voting';
      }
      return member;
    });
  }
};
