let pathtoconfig = './config.json';
let fs = require('fs');
const config = JSON.parse(fs.readFileSync(pathtoconfig, 'utf8'));

const DefaultCollectionManager = require('../managers/default');
var cManager = new DefaultCollectionManager(config);
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



