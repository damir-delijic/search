let pathtoconfig = './config.json';
let fs = require('fs');
const config = JSON.parse(fs.readFileSync(pathtoconfig, 'utf8'));

const Manager = require('./manager');
var cManager = new Manager(config);
cManager.build();


cManager.search({
    text: 'poQEFGr GWEGqwr fF,./Fć ptićurIn.a',
    collections: [
        {
            name:'movies',
            fields: ['title']
        }
    ]

});



