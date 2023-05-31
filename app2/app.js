let pathtoconfig = './config.json';
let fs = require('fs');
const config = JSON.parse(fs.readFileSync(pathtoconfig, 'utf8'));

const Manager = require('./manager');
var cManager = new Manager(config);
cManager.build();

let start = Date.now();
let result = cManager.search({
    text: 'bruce willis gldngksan',
    // text: 'bruce bruce bruce',
    collections: [
        {
            name:'movies',
            fields: ['title', 'actor']
        }
    ]

});
let end = Date.now();

console.log('Time in ms:', end-start);
// console.log('Result', result);






