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
        let entry, i, autocomplete;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            autocomplete = this.trie.suggest(entry.original);
            entry.neighborhood = autocomplete.suggestions;
            
            if(this.reverseIndex.contains(autocomplete.estimate)){
                entry.estimate = autocomplete.estimate;
            }else{
                entry.estimate = entry.neighborhood.length > 0 ? entry.neighborhood[0] : undefined;
            }
        }
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
                            if(this.reverseIndex.getTermFrequency(candidate) > this.reverseIndex.getTermFrequency(entry.neighborhood[0])){
                                entry.neighborhood.unshift(candidate)
                            }else{
                                entry.neighborhood.push(candidate);
                            }
                        }
                    }
                }

                if(entry.neighborhood.length > 0){
                    entry.estimate = entry.neighborhood[0];
                }
            }
            
        }
    }

    synonyms(entryVector){

    }

    termMeasure(term){
        return this.reverseIndex.getTermFrequency(term);
    }

    retrieveFilteredAppearances(entryVector, query){
        let hits = [];

        let entry, i, j, neighbor, hit;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            if(entry.estimate){
                hits.push({
                    term: entry.estimate,
                    appearances: this.filter(entry.estimate, query),
                    primary: true
                });
                
                for(j = 0; j < entry.neighborhood.length; j++){
                    neighbor = entry.neighborhood[j];
                    hit = {
                        term: neighbor,
                        appearances: this.filter(neighbor, query),
                        primary: false
                    }
                }
            }
        }

        return hits;
    }

    filter(term, query){
        let result = [];
        
        let appearances = this.reverseIndex.getTermAppearances(term);
        let appearance, collection, field;
        let i,j,k;

        for(i = 0; i < appearances.length; i++){
            appearance = appearances[i];

            for(j = 0; j < query.collections.length; j++){
                collection = query.collections[j];
                if(collection.name == appearance.s){ // s je izvorna kolekcija (source)
                    for(k = 0; k < collection.fields.length; k++){
                        field = collection.fields[k];
                        if(appearance.f == field){ // f je polje kolekcije 
                            result.push(appearance);
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

        // pretvara term -> appearances u document -> fields -> match,position

        let documents = [];
        let termDocumentFrequency = {};

        let hit, appearance, document;
        let i, j, k;
        let documentIsSeenForTheFirstTime;

        for(i = 0; i < hits.length; i++){
            hit = hits[i];
            termDocumentFrequency[hit.term] = hit.appearances.length;
            for(j = 0; j < hit.appearances.length; j++){
                appearance = hit.appearances[j];
                documentIsSeenForTheFirstTime = true;
                for(k = 0; k < documents.length; k++){
                    document = documents[k];
                    if(document.source == appearance.s && document.id == appearance.i){
                        documentIsSeenForTheFirstTime = false;
                        if(document.fields[appearance.f]){
                            document.fields[appearance.f].push([appearance.p, hit.term, hit.primary]); // nailazio je na dokument i na polje
                        }else{
                            document.fields[appearance.f] = [[appearance.p, hit.term, hit.primary]]; // nailazio je na dokument ali ne i na to polje
                        }
                        break;
                    }
                }

                if(documentIsSeenForTheFirstTime){ // ovo znaci da nije do sada naisao na taj dokument
                    let newDocument = {};
                    newDocument.source = appearance.s;
                    newDocument.id = appearance.i;
                    newDocument.fields = {};
                    newDocument.fields[appearance.f] = [[appearance.p, hit.term, hit.primary]];
                    documents.push(newDocument);
                }
            }
        }

        return {
            documents: documents,
            tdf: termDocumentFrequency
        };
    }

    sort(documents, tdf){
        let sorted = [];
        let unsortedDocument, i, sortedDocument;
        let numberOfDocuments = documents.length;
        while(documents.length > 0){
            unsortedDocument = documents.shift();
            let score = this.rank(unsortedDocument, tdf, numberOfDocuments);
            for(i = 0; i < sorted.length; i++){ // i = insertion index
                sortedDocument = sorted[i];
                if(sortedDocument.score < score){
                    break;
                }
            }
            sorted.splice(i-1, 0, {
                source: unsortedDocument.source,
                id: unsortedDocument.id,
                score: score
            });
        }

        return sorted;

    }

    rank(document, tdf, numberOfDocuments){

        let finalScore = 1;

        for(let field in document.fields){
            let score = this.scoreField(document.fields[field], tdf, numberOfDocuments);
            document['fields'][field] = score;
        }

        for(let field in document.fields){
            // pomoziti skorove polja sa tezinama i kombinovati ih na neki nacin
        }

        

        // // let config = this.config.data.collections[source];
        // // let weight = config.fields[field].weight;

        let score = 1;




        // score = score * weight;
        return 1;
    }

    scoreField(matches, tdf, numberOfDocuments){
        return 1;
    }

    formEntryVector(queryTerms){
        let entryVector = [];
        let i;
        for(i = 0; i < queryTerms.length; i++){
            entryVector.push({
                original: queryTerms[i],
                estimate: false,
                neighborhood: []
            });
        }
        return entryVector;
    }

    search(query){
        let start = Date.now();
        let total = {};
        let numTotal = 0;

        let queryText, queryTerms;

        queryText = query.text.toString();
        queryText = queryText.substring(0, 50);

        queryTerms = this.nlp(queryText);

        let entryVector = this.formEntryVector(queryTerms);
        
        this.autocomplete(entryVector); // modifikuje entryVector
        this.correct(entryVector); //  modifikuje entry vector
        this.synonyms(entryVector);
        // this.transformQuery(entryVector);
        // brojevi slovima i obrnuto
        // console.log(entryVector);

        let hits = this.retrieveFilteredAppearances(entryVector, query);
        let grouped = this.group(hits);
        let documents = grouped.documents;
        let tdf = grouped.tdf;
        for(let i = 0; i < documents.length; i++){
            console.log('Document: ', documents[i].source, documents[i].id);
            console.log('Fields: ', documents[i].fields);
        }
        // console.log(tdf);
        let sorted = this.sort(documents, tdf);
        // console.log(sorted)
        let end = Date.now();
        console.log(end - start)
        return sorted;

    }

}