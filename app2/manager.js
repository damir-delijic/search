const Collection = require('./collection');
const ReverseIndex = require('./reverseIndex');
const Preprocessor = require('./preprocessor')
const Trie = require('./trie');


const QueryHandler = require('./queryHandler');
const DocumentHandler = require('./documentHandler');


module.exports = class Manager{

    constructor(config){
        this.config = config;

        this.preprocessor = new Preprocessor();

        this.trie = new Trie(this.reverseIndex);
        this.reverseIndex = new ReverseIndex();
        this.collections = {};
        this.build();
        
        this.queryHandler = new QueryHandler(this.config.nlp, this.preprocessor, this.trie, this.reverseIndex);
        this.documentHandler = new DocumentHandler(this.reverseIndex, this.config.data);
    }

    build(){
        let collections, collection;

        collections = this.config.data.collections;

        for(collection in collections){
            
            let options = {
                name: collection,
                config: collections[collection],
                nlp: this.config.nlp,
                preprocessor: this.preprocessor,
                reverseIndex: this.reverseIndex,
                trie: this.trie
            }

            this.collections[collection] = new Collection(options);
            this.collections[collection].build();
        }
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

    calculateFieldPositionalScore(sortedMatches){

    }

    search(query){

        let vector = this.queryHandler.handle(query.text);
        console.log(vector);
        let documents = this.documentHandler.retrieve(vector, query.collections);
        // console.log(documents);

        // return documents;
        return [];
        // let hits = this.retrieveFilteredAppearances(entryVector, query);

        // let grouped = this.group(hits);
        // let documents = grouped.documents;
        // let tdf = grouped.tdf;
        
        // let sorted = this.sort(documents, tdf);



        // return sorted.slice(0, limit);

    }

}