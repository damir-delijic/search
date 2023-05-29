const Collection = require('./collection');

const Preprocessor = require('./xpreprocessor')
const DamLevDistance = require('./xdamLevDistance');
const ReverseIndex = require('./xreverseIndex');
const Trie = require('./xtrie');

module.exports = class Manager{

    constructor(config){
        this.collections = {};
        this.config = config;

        this.preprocessor = new Preprocessor();
        this.damLevDistance = new DamLevDistance(config.alphabet);
        this.reverseIndex = new ReverseIndex();
        this.trie = new Trie(this.reverseIndex);
    }

    build(){
        let collection;

        for(let collectionName in this.config.data.collections){
            
            let obj = {
                name: collectionName,
                config: this.config.data.collections[collectionName],
                defaultConfigNLP: this.config.nlp,
                preprocessor: this.preprocessor,
                reverseIndex: this.reverseIndex,
                trie: this.trie
            }
           
            collection = new Collection(obj);
            collection.build();
            this.collections[collectionName] = collection;
        }
    }

    get(name){
        return this.collections[name];
    }

    nlp(query){
        let config = this.config.nlp;
        config.separators = config.separators || [];
        config.charMap = config.charMap || false;
        config.minTokenLen = config.minTokenLen || 2;
        config.stopwords = config.stopwords || [];

        let result = [];
        let tokens = this.preprocessor.tokenizeMulti(query, config.separators);

        let i, j, isNotStopword, tokenIsLongEnough, stopword, token;

        for(i = 0; i < tokens.length; i++){
            tokens[i] = this.preprocessor.decapitalize(tokens[i]);
            tokens[i] = this.preprocessor.basicDepunctuation(tokens[i]);

            if(config.charMap){
                tokens[i] = this.preprocessor.reMapCharacters(tokens[i], config.charMap);
            }

            tokenIsLongEnough = tokens[i].length >= config.minTokenLen;
            
            if(tokenIsLongEnough){
                token = tokens[i];
                isNotStopword = true;
                for(j = 0; j < config.stopwords.length; j++){
                    stopword = config.stopwords[j];
                    if(token == stopword){
                        isNotStopword = false;
                        break;
                    }
                }
                if(isNotStopword) result.push(token);

            }

        }


        return result;
    }

    autocomplete(entryVector){
        let entry, i, trieResult;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            trieResult = this.trie.suggest(entry.original);
            entry.neighborhood = trieResult.suggestions;
            
            if(this.reverseIndex.contains(trieResult.estimate)){
                entry.estimate = trieResult.estimate;
            }else{
                entry.estimate = entry.neighborhood.length > 0 ? entry.neighborhood[0] : undefined;
            }

            if(entry.estimate){
                entry.weight = this.termWeightMeasure(entry.estimate);
            }
        }
    }

    termWeightMeasure(term){
        return ((this.reverseIndex.maxFrequency - this.reverseIndex.dictionary[term].fr + 0.01) / ( this.reverseIndex.maxFrequency + 0.01)).toFixed(2); // sto je blizi maksimalnoj frekvenciji, manji mu je skor
    }

    correct(entryVector){
        let entry, i, damLevResult, candidate, j, entryHasNoEstimate, tokenIsLongEnough;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];
            entryHasNoEstimate = !entry.estimate
            tokenIsLongEnough = entry.original.length > this.config.minSingleEditTokenLen;

            if(entryHasNoEstimate && tokenIsLongEnough){
                if(entry.original.length < this.config.minDoubleEditTokenLen){
                    damLevResult = this.damLevDistance.calculateSingle(entry.original);
                }else{
                    damLevResult = this.damLevDistance.calculateDouble(entry.original);
                }
                for(j = 0; j < damLevResult.length; j++){
                    candidate = damLevResult[j];
                    if(this.reverseIndex.contains(candidate)){
                        if(entry.neighborhood.length == 0){
                            entry.neighborhood.push(candidate);
                        }else{
                            if(this.reverseIndex.dictionary[candidate].fr > this.reverseIndex.dictionary[entry.neighborhood[0]].fr){
                                entry.neighborhood.unshift(candidate)
                            }else{
                                entry.neighborhood.push(candidate);
                            }
                        }
                    }
                }

                if(entry.neighborhood.length > 0){
                    entry.estimate = entry.neighborhood[0];
                    entry.weight = this.termWeightMeasure(entry.estimate);
                }
            }
            
        }
    }

    synonyms(entryVector){

    }

    filter(term, query){
        let result = [];


        let obj, objs, col, i, j, k, field;
        
        objs = this.reverseIndex.dictionary[term].dl;
        
        for(i = 0; i < objs.length; i++){
            obj = objs[i];
            // prolazi li filter kolekcija
            for(j = 0; j < query.collections.length; j++){
                col = query.collections[j];
                if(obj.s == col.name){
                    // prolazi li filter polja
                    for(k = 0; k < col.fields.length; k++){
                        field = col.fields[k];
                        if(obj.f == field){
                            result.push(obj);
                            break;
                        }
                    }
                    break;
                }
            }
        }

        return result
    }

    group(hits){
        let result = [];

        let hit, objs, obj, weight, i, isNotFound, doc, j;
        
        let tempObj;

        for(hit in hits){
            weight = hits[hit].weight;
            objs = hits[hit].objs;
            
            for(i = 0; i < objs.length; i++){
                obj = objs[i];
                isNotFound = true;
                for(j = 0; j < result.length; j++){
                    doc = result[j];
                    if(doc.source == obj.s && doc.id == obj.i){
                        isNotFound = false;
                        doc['fields'][obj.f]['positions'].push([obj.p, weight]);
                        break; // moze break jer ga kacim na taj i ni na jedan drugi
                    }
                }

                if(isNotFound){
                    tempObj = {};
                    tempObj['source'] = obj.s;
                    tempObj['id'] = obj.id;
                    tempObj['fields'] = {};
                    tempObj['fields'][obj.f]['positions'] = [[obj.p, weight]];
                    result.push(tempObj);
                }
            }
        }

        return result;
    }

    sort(documents){
        let result = [];
        let document, i, resdoc;

        while(documents.length > 0){
            document = documents.shift();
            let score = this.rank(document);
            for(i = 0; i < result.length; i++){ // i = insertion index
                resdoc = result[i];
                if(resdoc.score < score){
                    break;
                }
            }
            result.splice(i-1, 0, {
                source: document.source,
                id: document.id,
                score: score
            });
        }

        return result;

    }

    rank(document){

        let fields = document.fields;

        for(let field in fields){
            let score = this.scorePositions(fields[field].positions);
            document['fields'][field] = score;
        }

        // let config = this.config.data.collections[source];
        // let weight = config.fields[field].weight;

        let score = 0;




        // score = score * weight;
        return score;
    }

    scorePositions(positions){

    }

    search(query){
        let start = Date.now();
        let total = {};
        let numTotal = 0;

        let queryText, queryTerms;

        queryText = query.text.toString();
        queryText = queryText.substring(0, 50);
        queryTerms = this.nlp(queryText);

        let entryVector = [];
        let i;
        for(i = 0; i < queryTerms.length; i++){
            entryVector.push({
                original: queryTerms[i],
                estimate: false,
                neighborhood: [],
                weight: 0,
                isKnown: this.reverseIndex.contains(queryTerms[i]) ? true : false
            });
        }
        
        this.autocomplete(entryVector); // modifikuje entryVector
        this.correct(entryVector); //  modifikuje entry vector
        this.synonyms(entryVector);
        // this.transformQuery(entryVector);
        // brojevi slovima i obrnuto
        // console.log(entryVector);

        let hits = {};

        let entry;

        let j, neighbor;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            if(entry.estimate){
                hits[entry.estimate] = {
                    weight: entry.weight,
                    objs: this.filter(entry.estimate, query)
                }
                
                for(j = 0; j < entry.neighborhood.length; j++){
                    neighbor = entry.neighborhood[j];
                    hits[neighbor] = {
                        weight: entry.weight * 0.5,
                        objs: this.filter(neighbor, query)
                    }
                }
            }
        }

        let documents = this.group(hits);
        let sorted = this.sort(documents);
        let end = Date.now();
        console.log(end - start)
        return sorted;

    }

}