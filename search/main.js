const PostingList = require('./postingList');
const SpellCorrector = require('./spellCorrector');
const AdaptiveRadixTree = require('./adaptiveRadixTree');
const Search = require('./search')

// nekakvu konfiguraciju ubaciti

var letters = 'abcdefghijklmnopqrstuvwxyz';
var reverseIndexPath = '../data/reverseIndex.json';

var postingList = new PostingList(reverseIndexPath);
var adaptiveRadixTree = new AdaptiveRadixTree(postingList);
var spellCorrector = new SpellCorrector(adaptiveRadixTree, postingList, letters);

var search = new Search(postingList, spellCorrector, adaptiveRadixTree);

var readline = initReadline();

let startTime, endTime, time, results;

askForOneQuery(readline);
// askForQueryCont(readline);


function initReadline(){
    var readline  = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return readline;
}


function askForOneQuery(rl){
    rl.question(`Query: `, query => {
        startTime = Date.now();
        let results = search.search(query);
        endTime = Date.now();
        time = endTime-startTime;

        console.log('---------------');

        console.log('Time: ', time);
        console.log('-----');

        console.log(results);
        console.log('-----');

        console.log('---------------');

        rl.close();
    });
}

function askForQueryCont(rl){
    rl.question(`Query: `, query => {
        if(query == 'exit'){
            rl.close();
        }else{
            startTime = Date.now();
            results = search.search(query);
            endTime = Date.now();
            time = endTime-startTime;
            console.log('---------------');

            console.log('Time: ', time);
            console.log('-----');

            console.log(results);
            console.log('-----');

            console.log('---------------');
            askForQueryCont(rl);
        }
    });
}


