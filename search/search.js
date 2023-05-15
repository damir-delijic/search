
module.exports = class Search{
    
    constructor(pl, sc, art){
        this.pl = pl;
        this.sc = sc;
        this.art = art;
    }

    search(word){
        // preprocesiranje treba da se doradi nad word, razdvoji na tokene itd, razlicita relevantnost termina koji su true, autocorect, spell correct
        if(word.length < 3) return [];

        let suggestionLimit = 5;
        let autoComplete = this.art.search(word, suggestionLimit);
 
        let spellCorrection = [];
        
        if(autoComplete.length < suggestionLimit){
            if(autoComplete[0] == word || word.length < 4){
                spellCorrection = this.sc.singleCorrection(word);
            }else{
                spellCorrection = this.sc.doubleCorrection(word);
            }
        }
        

        let terms = [...new Set([...autoComplete, ...spellCorrection])];

        let filtered = this.filterTerms(terms);

        let docs = this.getDocuments(filtered);
        let sorted = this.sortDocuments(docs);
        return sorted;
    }

    filterTerms(terms){
        return terms;
        if(terms.length == 0) return [];

        let result = [terms[0]];
        let i, j, term, resTerm, termFreq, resTermFreq;
        let didFindPlace;

        for(i = 1; i < terms.length; i++){
            term = terms[i];
            termFreq = this.pl.dict[term].globalFrequency;

            didFindPlace = false;

            for(j = 0; j < result.length; j++){
                resTerm = result[j];
                resTermFreq = this.pl.dict[resTerm].globalFrequency;
                if(termFreq < resTermFreq){
                    result.splice(j, 0, term);
                    didFindPlace = true;
                    break;
                }
            }
        }
    }

    getDocuments(terms){
        let result = [];
        let i, j, term;

        for(i = 0; i < terms.length; i++){
            term = terms[i];

            for(j = 0; j < this.pl.dict[term].docs.length; j++){
                result.push({
                    title: this.pl.dict[term].docs[j].title,
                    hit: term
                });
            }
        }

        return result;
    }

    sortDocuments(docs){
        return docs;
    }

}