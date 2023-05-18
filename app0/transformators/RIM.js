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

// let fieldsOfInterest = ['title', 'director', 'actor'];
let fieldsOfInterest = ['title'];


let i, k, obj, fieldName, fieldIndex, fieldContent;

var dataRows = [];

var reverseIndex = {
    "term":{
        "globalFrequency": 2,
        "docs": [
            {
                "docId": 100,
                "docFrequency": 2,
                "positions": [5, 10]
            }
        ]
    }
}

let dataRow, docTerms;

let split, token;

function preprocessDocument(doc){
    let result = [];
    split = doc.split(" ");
    for(let j = 0; j < split.length; j++){
        token = split[j];
        token = token.toLowerCase();
        token = token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        if(token.length > 1) result.push(token);
    }

    return result;
}

let docIterator, tempDoc;

function processTerm(term, docId, position, trueTitle){
    if(reverseIndex[term]){
        reverseIndex[term].globalFrequency++;
       
        let isDocFound = false;

        for(docIterator = 0; docIterator < reverseIndex[term].docs.length; docIterator++){
            tempDoc = reverseIndex[term].docs[docIterator];
            if(tempDoc.docId == docId){
                isDocFound = true;
                tempDoc.docFrequency++;
                tempDoc.positions.push(position);
                break;
            }
        }

        if(!isDocFound){
            reverseIndex[term].docs.push({
                docId: docId,
                docFrequency: 1,
                positions: [position],
                trueTitle: trueTitle
            })
        }

    }else{
        reverseIndex[term] = {
            globalFrequency: 1,
            docs:[
                {
                    docId: docId,
                    docFrequency: 1,
                    positions:[position],
                    trueTitle: trueTitle
                }
            ]
        }
    }
}

fs.createReadStream('../data/mov.csv')
    .pipe(parse({delimiter: ',', from_line: 2, relax_quotes: true}))
    .on('data', function(csvrow) {
        lineCounter++;
        //do something with csvrow
        obj = {
            id: lineCounter,
            content: "",
            trueTitle: ""
        };
        for(i = 0; i < fieldsOfInterest.length; i++){
            fieldName = fieldsOfInterest[i];
            fieldIndex = schema[fieldName];
            fieldContent = csvrow[fieldIndex];
            if(fieldName == 'title') obj["trueTitle"] = fieldContent;
            obj["content"] += (" " + fieldContent);
        }
        dataRows.push(obj);      
    })
    .on('end',function() {
        // do something with csvData
        // console.log(dataRows)
        let tempTerm;
        for(i = 0; i < dataRows.length; i++){
            dataRow = dataRows[i];
            docTerms = preprocessDocument(dataRow.content);
            for(k = 0; k < docTerms.length; k++){
                tempTerm = docTerms[k];
                processTerm(tempTerm, dataRow.id, k, dataRow.trueTitle);
            }
        }

        fs.writeFile("../data/reverseIndex.json", JSON.stringify(reverseIndex), function(err) {
            if (err) {
                console.log(err);
            }
        });

    });

