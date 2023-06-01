const DamLevDistance = require('./damLevDistance');

module.exports = {
    transform: function(options){
        // uzima entry vektor, provlaci ga kroz funkcije i mijenja ga(procedura)
        internal.autocomplete(options);
        internal.correct(options);
        internal.synonims(options);
        return options.entryVector;
    }
}

let internal = {
    autocomplete: function(options){ // individual term wise autocomplete
        let dictionary = options.dictionary;
        let trie = options.trie;
        let entryVector = options.entryVector;

        let entry, i, autocomplete;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            autocomplete = trie.suggest(entry.original);
            entry.neighborhood = autocomplete.suggestions;
            
            if(dictionary.contains(autocomplete.subWord)){
                entry.estimate = autocomplete.subWord;
            }else{
                entry.estimate = entry.neighborhood.length > 0 ? entry.neighborhood[0] : false;
            }
        }
    },

    correct: function(options){
        let dictionary = options.dictionary;
        let entryVector = options.entryVector;

        let minEditLen = options.minEditLen;
        let minDoubleEditLen = options.minDoubleEditLen;
        let letters = options.letters;


        let entry, i, damLevResult, candidate, j, entryHasNoEstimate, tokenIsLongEnough;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];
            entryHasNoEstimate = !entry.estimate
            tokenIsLongEnough = entry.original.length > minEditLen;
            
            if(entryHasNoEstimate && tokenIsLongEnough){
                if(entry.original.length < minDoubleEditLen){
                    damLevResult = DamLevDistance.single(entry.original, letters);
                }else{
                    damLevResult = DamLevDistance.double(entry.original, letters);
                }
                return false;
                for(j = 0; j < damLevResult.length; j++){
                    candidate = damLevResult[j];
                    if(dictionary.contains(candidate)){
                        entry.neighborhood.push(candidate);
                        break;
                        // if(entry.neighborhood.length == 0){
                        //     entry.neighborhood.push(candidate);
                        // }else{
                        //     if(dictionary.getFrequency(candidate) > dictionary.getFrequency(entry.neighborhood[0])){
                        //         entry.neighborhood.unshift(candidate)
                        //     }else{
                        //         entry.neighborhood.push(candidate);
                        //     }
                        // }
                    }
                }

                if(entry.neighborhood.length > 0){
                    entry.estimate = entry.neighborhood[0];
                }
            }
            
        }
    },

    synonims: function(options){

    }
}