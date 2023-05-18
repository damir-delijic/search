let pathtoconfig = './config.json';
let fs = require('fs');
const config = JSON.parse(fs.readFileSync(pathtoconfig, 'utf8'));



const CollectionManager = require('../collection/manager');
var cManager = new CollectionManager(config);
cManager.buildCollections();


let query = {
    text: 'porodic',
    collections: [
        {
            name: 'movies',
            fields: ['title']
        }
    ]
}

let result = cManager.search(query);
console.log(result)




