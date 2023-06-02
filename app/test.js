

var cManager = require('./app').startManager(__dirname);

var readline = initReadline();
let startTime, endTime, time, results;
// askForOneQuery(readline);
askForQueryCont(readline);


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
            results = cManager.search({
                text: query,
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
            endTime = Date.now();
            time = endTime-startTime;
            console.log(results);
            console.log(time)
            console.log();
            askForQueryCont(rl);
        }
    });
}