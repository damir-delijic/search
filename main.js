
let fs = require('fs');
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

const Preprocessor = require('./textPreprocessors/basic');
const PostingList = require('./search/postingList');
const SpellCorrector = require('./search/spellCorrector');
const AdaptiveRadixTree = require('./search/adaptiveRadixTree');
const Search = require('./search/search')

var letters = config.alphabet;

// preprocessor
var ppcfg = config.preprocessor;

// charmap mora da preslikava u alphabet skup

// for(let char in ppcfg.charMap){
//     if(!letters.includes(ppcfg.charMap[char])){
//         ppcfg.charMap[char] = '';
//     }
// }

var preprocessor = new Preprocessor(ppcfg.minTokenLen, ppcfg.stopwords, ppcfg.charMap);

// postingList
var datapath = config.postingList.datapath;
var persistedIndexPath = config.postingList.persistedIndexPath;
var fields = config.postingList.fieldsToIndex;
var readFromPersisted = config.postingList.readFromPersisted;
var postingList = new PostingList(datapath, preprocessor, fields, readFromPersisted, persistedIndexPath);

// adaptive radix
var dtwl = config.art.distanceToWordLengthRatioThreshold;
var adaptiveRadixTree = new AdaptiveRadixTree(postingList, dtwl);

// spell corrector
var spellCorrector = new SpellCorrector(adaptiveRadixTree, postingList, letters);

// search
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


