module.exports = class QueryHandler{

    constructor(config, preprocessor, trie, dictionary){
        this.nlp = config;
        this.preprocessor = preprocessor;
        this.trie = trie;
        this.dictionary = dictionary;
    }

    handle(query){
        let tokens = this.process(query.substring(0, query.length > this.nlp.maxQueryLength ? this.nlp.maxQueryLength : query.length));
        let vector = [];
        this.vectorize(tokens, vector);
        this.autocomplete(vector);
        this.correct(vector);
        vector = this.addNeighbors(vector);
        vector = this.synonims(vector);
        return vector;
    }

    autocomplete(vector){
        let entry, i, autocomplete;

        for(i = 0; i < vector.length; i++){
            entry = vector[i];
            autocomplete = this.trie.suggest(entry.original);

            if(this.dictionary.contains(entry.original)){
                entry.estimate = entry.original;
            }else if(autocomplete.length > 0){
                entry.estimate = autocomplete.shift();
            }

            entry.neighborhood = autocomplete;

        }
    }

    correct(vector){
        let entry, i, j, entryHasNoEstimate, candidates, candidate, isLongEnough;

        for(i = 0; i < vector.length; i++){
            entry = vector[i];
            entryHasNoEstimate = !entry.estimate;
            isLongEnough = entry.original.length >= this.nlp.minCorrectionLength;
            if(entryHasNoEstimate && isLongEnough){
                candidates = this.levenshtein(entry.original);
                for(j = 0; j < candidates.length; j++){
                    candidate = candidates[j];
                    if(this.dictionary.contains(candidate)){
                        if(entry.neighborhood.length == 0){
                            entry.neighborhood.push(candidate);
                        }else{
                            if(this.dictionary.getFrequency(candidate) > this.dictionary.getFrequency(entry.neighborhood[0])){
                                entry.neighborhood.unshift(candidate)
                            }else{
                                entry.neighborhood.push(candidate);
                            }
                        }
                    }
                }
                if(entry.neighborhood.length > 0){
                    entry.estimate = entry.neighborhood.shift();
                }
            }

        }
    }

    levenshtein(word){
        let splits = []
        let letters = this.nlp.letters;
        let i, split, l, r, j, c;

        for(i = 0; i < word.length + 1; i++){
            splits.push([word.substring(0, i), word.substring(i)])
        }

        let deletes = [];
        let replaces = [];
        let inserts = [];

        for(i = 0; i < splits.length; i++){
            split = splits[i];
            l = split[0];
            r = split[1];

            if(r){
                deletes.push(l + r.substring(1));
            }

            for(j = 0; j < letters.length; j++){
                c = letters[j];
                inserts.push(l + c + r);
                if(r) replaces.push(l + c + r.substring(1));
            }
        }
        
        return deletes.concat(replaces).concat(inserts);
    }

    addNeighbors(vector){ // osim sto dodaje komsije, u slucaju da rijec nema procjenu, ne dodaje je u rezultujuci vektor
        let newVector = [];

        let i, entry, neighbor;
        for(i = 0; i < vector.length; i++){

            entry = vector[i];

            while(entry.neighborhood.length > 0){
                neighbor = entry.neighborhood.shift();
                newVector.push({
                    estimate: neighbor,
                    score: 0.05
                });
            }

            if(entry.estimate){
                newVector.push({
                    estimate: entry.estimate,
                    score: 1
                })
            }
        }
       return newVector;
    }

    synonims(vector){
        return vector;
    }

    vectorize(tokens, vector){
        let i;
        for(i = 0; i < tokens.length; i++){
            vector.push({
                original: tokens[i],
                estimate: false,
                neighborhood: []
            });
        }
        return vector;
    }

    process(text){
        let separators = this.nlp.separators || [];
        let charMap = this.nlp.charMap;
        let minTokenLength = this.nlp.minTokenLength;
        let stopwords = this.nlp.stopwords || [];
    
        let result = [];
        let tokens = this.preprocessor.tokenize(text, separators);

        let i, j, isNotStopword, stopword, token;

        for(i = 0; i < tokens.length; i++){
            tokens[i] = this.preprocessor.decapitalize(tokens[i]);
            tokens[i] = this.preprocessor.depunctuate(tokens[i]);

            if(charMap){
                tokens[i] = this.preprocessor.reMapCharacters(tokens[i], charMap);
            }

            token = tokens[i];
            if(token.length > minTokenLength){
                isNotStopword = true;
                for(j = 0; j < stopwords.length; j++){
                    stopword = stopwords[j];
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

}