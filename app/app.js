
/* Read config file */
let pathtoconfig = './config.json';
let fs = require('fs');
const config = JSON.parse(fs.readFileSync(pathtoconfig, 'utf8'));

/* Initialize structures */
const Manager = require('./manager');
var cManager = new Manager(config);

/* Query */

let start = Date.now();
let result = cManager.search({
    text: '200',
    // text: 'bruce bruce bruce',
    collections: [
        {
            name:'movies',
            fields: ['title', 'actor']
        },
        {
            name:'tvshows',
            fields: ['NAME']
        }
    ]

});
let end = Date.now();

console.log(result);

console.log('Time in ms:', end-start);







