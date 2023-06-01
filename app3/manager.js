const Collection = require('./collection');
const ReverseIndex = require('./reverseIndex');
const Trie = require('./trie');

const Preprocessor = require('./preprocessor')

const QueryVectorizer = require('./vectorizeQuery');
const QueryTransformator = require('./transformQuery');
const DocumentRetriever = require('./documentRetriever');

module.exports = class Manager{

    constructor(config){
        this.config = config;

        this.reverseIndex = new ReverseIndex();
        this.trie = new Trie(this.reverseIndex);
        this.collections = {};
        this.build();
    }

    build(){
        let collections, collection, options;

        collections = this.config.data.collections;

        for(collection in collections){
            
            options = {
                name: collection,
                config: collections[collection],
                defaultConfigNLP: this.config.nlp,
                reverseIndex: this.reverseIndex,
                trie: this.trie
            }
           
            this.collections[collection] = new Collection(options);
            this.collections[collection].build();
        }
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

    search(query){
        let queryVectorizerConfig = {
            maxQueryLen: this.config.maxQueryLen,
            separators: this.config.nlp.separators,
            charMap: this.config.nlp.charMap,
            minTokenLen: this.config.nlp.minTokenLen,
            stopwords: this.config.nlp.stopwords
        }
        let entryVector = QueryVectorizer.vectorize({
            text: query.text,
            config: queryVectorizerConfig
        });

        // console.log(entryVector)

        let transformedVector = QueryTransformator.transform({
            dictionary: this.reverseIndex,
            trie: this.trie,
            entryVector: entryVector,
            minEditLen: this.config.minSingleEditTokenLen,
            minDoubleEditLen: this.config.minDoubleEditTokenLen,
            letters: this.config.alphabet
        });

        // console.log(transformedVector);

        // let document = this.documentRetriever.retrieveDocuments(transformedVector, query);
        return [];
        // let hits = this.retrieveFilteredAppearances(entryVector, query);

        // let grouped = this.group(hits);
        // let documents = grouped.documents;
        // let tdf = grouped.tdf;
        
        // let sorted = this.sort(documents, tdf);



        // return sorted.slice(0, limit);

    }

}