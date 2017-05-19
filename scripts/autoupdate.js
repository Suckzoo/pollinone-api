const app = require('../server/server');
const datasource = app.datasources['db'];

const models = ['ACL', 'Vote', 'Member'];
function autoUpdate() {
  datasource.autoupdate(models, err => {
    if (err) {
      console.error(err);
    }
    console.log('finished');
    datasource.disconnect();
  });
}

autoUpdate();
