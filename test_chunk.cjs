const fs = require('fs');
const d = require('./frontend/src/utils/web_build.json');
const keys = Object.keys(d);
console.log(keys.map(k => `${k}: ${d[k].data.length}`));
