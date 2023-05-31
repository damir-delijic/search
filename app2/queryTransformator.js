module.exports = class QueryTransformator{

    constructor(trie, damLevDistance, reverseIndex, singleEditMinLen, doubleEditMinLen){
        this.trie = trie;
        this.damLevDistance = damLevDistance;
        this.reverseIndex = reverseIndex;
        this.singleEditMinLen = singleEditMinLen;
        this.doubleEditMinLen = doubleEditMinLen;
    }

    transform(entryVector){
        this.autocomplete(entryVector);
        this.correct(entryVector);
        this.synonyms(entryVector);
        return entryVector;
    }

    autocomplete(entryVector){
        let entry, i, autocomplete;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            autocomplete = this.trie.suggest(entry.original);
            entry.neighborhood = autocomplete.suggestions;
            
            if(this.reverseIndex.contains(autocomplete.subWord)){
                entry.estimate = autocomplete.subWord;
            }else{
                entry.estimate = entry.neighborhood.length > 0 ? entry.neighborhood[0] : false;
            }
        }
    }

    correct(entryVector){
        let entry, i, damLevResult, candidate, j, entryHasNoEstimate, tokenIsLongEnough;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];
            entryHasNoEstimate = !entry.estimate
            tokenIsLongEnough = entry.original.length > this.singleEditMinLen;

            if(entryHasNoEstimate && tokenIsLongEnough){
                if(entry.original.length < this.doubleEditMinLen){
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

  
}