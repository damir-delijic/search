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

    retrieveFilteredAppearances(entryVector, query){
        let hits = [];

        let entry, i, j, neighbor;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            if(entry.estimate){
                hits.push({
                    t: entry.estimate, // term
                    a: this.filter(entry.estimate, query), // appearances filtered by query
                    p: true // isprimary
                });
                
                for(j = 0; j < entry.neighborhood.length; j++){
                    neighbor = entry.neighborhood[j];
                    hits.push({
                        t: neighbor, // term
                        a: this.filter(neighbor, query), // appearances filtered by query
                        p: false // isprimary term 
                    });
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
        let termFrequencyAfterFilter = {};
        let termDocumentFrequency
        let hit, appearance, document;
        let i, j, k;
        let documentIsSeenForTheFirstTime;

        let term, appearances, primary;

        for(i = 0; i < hits.length; i++){
            hit = hits[i];

            term = hit.t;
            appearances = hit.a;
            primary = hit.p;

            termFrequencyAfterFilter[term] = appearances.length; // u koliko se dokumenata javlja nakon filtera po query-u

            for(j = 0; j < appearances.length; j++){
                appearance = appearances[j];
                documentIsSeenForTheFirstTime = true;
                for(k = 0; k < documents.length; k++){
                    document = documents[k];
                    if(document.s == appearance.s && document.i == appearance.i){
                        documentIsSeenForTheFirstTime = false;
                        if(document.f[appearance.f]){
                            document.f[appearance.f].push({
                                ps: appearance.p, // pozicija
                                t: term, // rijec
                                p: primary // is primary
                            }); // nailazio je na dokument i na polje
                        }else{
                            document.f[appearance.f] = [{
                                ps: appearance.p,
                                t: term,
                                p: primary
                            }]; // nailazio je na dokument ali ne i na to polje
                        }
                        break;
                    }
                }

                if(documentIsSeenForTheFirstTime){ // ovo znaci da nije do sada naisao na taj dokument
                    let newDocument = {};
                    newDocument.s = appearance.s;
                    newDocument.i = appearance.i;
                    newDocument.f = {};
                    newDocument.f[appearance.f] = [{
                        ps: appearance.p,
                        t: term,
                        p: hit.primary
                    }];
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
        // {s: soruce, i:id, fields: {
        //     fieldname: {ps:position, t:term, p: primary}
        // }}

        let tidf = {};
        for(let term in tdf){
            tidf[term] = (Math.log( numberOfDocuments / tdf[term] ) + 1)/toFixed(4); 
        }


        while(documents.length > 0){
            unsortedDocument = documents.shift();
            let score = this.rank(unsortedDocument, tidf);
            for(i = 0; i < sorted.length; i++){ // i = insertion index
                sortedDocument = sorted[i];
                if(sortedDocument.score < score){
                    break;
                }
            }
            sorted.splice(i, 0, {
                source: unsortedDocument.s,
                id: unsortedDocument.i,
                score: score
            });
        }

        return sorted;
    }

    rank(document, tidf){
        
        let result = 0.01;

        let sumOfWeights = 0.01;

        let config = this.config.data.collections[document.s];
        let score, weight;
        for(let field in document.f){
            score = this.scoreField(document.f[field], tidf);
            weight = config.fields[field].weight || 1;
            result = result + score * weight;
            sumOfWeights += weight;
        }

        return (result / sumOfWeights).toFixed(4);
    }

    scoreField(matches, tidf){
        // basic da ih izbrojim odnosno da svaki iam istu tezinu
        // da saberem njihove razlicite tezine
        let sortedMatches = [];
        let match, i;

        while(matches.length > 0){
            match = matches.shift();
            for(i = 0; i < sortedMatches.length; i++){
                if(match.ps < sortedMatches[i]){
                    break;
                }
            }
            sortedMatches.splice(i, 0 , match);
        }

        if(sortedMatches.length == 0) return 0; // ne bi trebalo da se desava
        else if(sortedMatches.length == 1){
            let match = sortedMatches[0];
            let term = match.t;
            let primary = match.p;
            return this.calculateTermScore(term, primary, tidf[term]);
        }else{

        }


        let result = 1;
        let fieldPositionalScore = this.calculateFieldPositionalScore(sortedMatches);
        let fieldTermOccurenceScore = this.calculateFieldTermOccurenceScore(sortedMatches, tidf);
        result = result * fieldTermOccurenceScore * fieldPositionalScore;
        return result;

        let term, primary;
        
        previous = sortedMatches[0];
        term = previous.t;
        primary = previous.p;

        termScore = this.calculateTermScore(term, primary, tidf[term]);

        if(sortedMatches.length == 1){
            result = termScore;
            return result;
        }

        let score = 1;
        let isCombo = false;
        let comboAccumulationFactor = 1;
        let comboAccumulated = 0;
        let previous, current, termScore;
        previous = sortedMatches[0];
        termScore = this.calculateTermScore(previous[1], previous[2], tdf[previous[1]], numberOfDocuments, averagetf);
        if(sortedMatches.length == 1){
            return termScore;
        }

        comboAccumulated = termScore;
        for(i = 1; i < sortedMatches.length; i++){
            current = sortedMatches[i];
            isCombo = isCombo && current[0] - previous[0] <= 1;
            termScore = this.calculateTermScore(current[1], current[2], tdf[current[1]], numberOfDocuments, averagetf);
            if(mustPrint){
                // console.log('Term:', previous[1]);
                // console.log('Term score: ', termScore);
            }
            if(isCombo){
                comboAccumulationFactor += 1;
                comboAccumulated = comboAccumulated + termScore;
            }else{
                score = score + comboAccumulated * comboAccumulationFactor;
                score = score + termScore;
                comboAccumulated = 0;
                comboAccumulationFactor = 1;
            }
        }

        if(i == sortedMatches.length && isCombo){
             score = score + comboAccumulated * comboAccumulationFactor;
             comboAccumulated = 0;
             comboAccumulationFactor = 1;
        }

        return score;
    }

    calculateFieldTermOccurenceScore(matches, tidf){
        let result = 0;
        let match, i, term, primary;
        for(i = 0; i < matches.length; i++){
            match = matches[i];
            term = match.t;
            primary = match.p;
            result += (this.calculateTermScore(this.getTermFrequency(term), primary, tidf[term]));
        }

        return result > 0 ? result : 1;
    }

    calculateFieldPositionalScore(sortedMatches){

    }

    calculateTermScore(tf, primary, termtidf){
        let pf = primary ? 1 : 0.01;
        


        return 1;
        // let tf = this.reverseIndex.getTermFrequency(term);
        // let primarityFactor = isPrimary ? 1 : 0.1;
        // let abs = averagetf - tf < 0 ? tf - averagetf : averagetf - tf;
        // let tfAvgTfMeasure = ((averagetf + 0.1) / (abs + 0.1 ))
        // return primarityFactor * tfAvgTfMeasure * (numberOfDocuments / df).toFixed(4);
    }

    search(query, limit){

        let queryText, queryTerms;

        queryText = query.text.toString();
        queryText = queryText.substring(0, 50);

        queryTerms = this.nlp(queryText);

        let entryVector = this.formEntryVector(queryTerms);
        
        // modifikuju entry vektor
        this.autocomplete(entryVector);
        this.correct(entryVector);
        this.synonyms(entryVector);
        // this.transformQuery(entryVector);
        // brojevi slovima i obrnuto
        

        let hits = this.retrieveFilteredAppearances(entryVector, query);

        let grouped = this.group(hits);
        let documents = grouped.documents;
        let tdf = grouped.tdf;
        
        let sorted = this.sort(documents, tdf);



        return sorted.slice(0, limit);

    }

}