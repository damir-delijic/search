var fs = require('fs'); 
var { parse } = require('csv-parse');


let lineCounter = 0;

let schema = {
    'title': 0,
    'original_title': 1,
    'description': 2,
    'rating': 3,
    'year': 4,
    'duration': 5,
    'director': 6,
    'actor': 7,
    'writer': 8,
    'lic_start': 9,
    'lic_end': 10,
    'icon': 11
}

let fieldsOfInterest = ['title', 'director', 'actor', 'rating', 'year', 'writer'];


let i, obj, fieldName, fieldIndex, fieldContent;

var data = [];

fs.createReadStream('../data/mov.csv')
    .pipe(parse({delimiter: ',', from_line: 2, relax_quotes: true}))
    .on('data', function(csvrow) {
        lineCounter++;
        //do something with csvrow
        obj = {
            id: lineCounter.toString()
        };
        for(i = 0; i < fieldsOfInterest.length; i++){
            fieldName = fieldsOfInterest[i];
            fieldIndex = schema[fieldName];
            fieldContent = csvrow[fieldIndex];
            obj[fieldName] = fieldContent;
        }
        data.push(obj);     
    })
    .on('end',function() {
        // do something with csvData
        let writeObj = {
            'documents': data
        }

        var writer = fs.createWriteStream('../data/movies.json', {
            flags: 'a' // 'a' means appending (old data will be preserved)
        })

        writer.write(JSON.stringify(writeObj));

    });

