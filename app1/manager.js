const Collection = require('./collection');
const Preprocessor = require('./preprocessor')
const SpellC = require('./spellC');


module.exports = class Manager{

    constructor(config){
        this.collections = {};
        this.config = config;
        this.pp = new Preprocessor(config.textprocessing);
        this.sc = new SpellC(config.alphabet);
    }

    build(){
        let name, config, collection;

        for(let col in this.config.data.collections){
            name = col;
            config = this.config.data.collections[name];
            collection = new Collection(name, config, this.pp);
            collection.build();
            this.collections[name] = collection;
        }
    }

    get(name){
        return this.collections[name];
    }

    correctS(word){
        let firstMostFrequentWord, secondMostFrequentWord;

        let corrections = this.sc.damLevDistance2(word);
        let term;
        for(let i = 0; i < corrections.length; i++){
            term = corrections[i];
            if(this.pl.contains(term)){
                if(firstMostFrequentWord){
                    if(this.pl.dict[term].fr > this.pl.dict[firstMostFrequentWord].fr){
                        secondMostFrequentWord = firstMostFrequentWord;
                        firstMostFrequentWord = term;
                    }else{
                        if(secondMostFrequentWord){
                            if(this.pl.dict[term].fr > this.pl.dict[secondMostFrequentWord].fr){
                                secondMostFrequentWord = term;
                            }
                        }else secondMostFrequentWord = term;
                    }
                }else firstMostFrequentWord = term;
            }
        }
        return [firstMostFrequentWord, secondMostFrequentWord];
    }

    correctM(terms){
        let result = {}
        let term, i, words;

        for(i = 0; i < terms.length; i++){
            term = terms[i];
            words = this.correctS(term);
            result[term] = words;
        }

        return result;
    }

    artS(term){
        return this.art.search(term);
    }

    artM(terms){
        let result = {};
        let i, term;
        for(i = 0; i < terms.length; i++){
            term = terms[i];
            result[term] = this.artS(term);
        }
        return result;
    }

    search(query){
        let total = {};
        let numTotal = 0;

        let queryText, queryTerms;

        queryText = query.text.toString();
        queryTerms = this.pp.process(queryText, true);
        

        let autocomplete = this.artM(queryTerms);

        // midlleware na nivou menadzera postaviti, da li sadrzi neke KLJUCNE rijeci, query transformacija, sinonimi itd
        // probati art koji sadrzi shinglove

        // queriedcols, queriedcollecitons, queriedcolname, queriedcolfields, i, collecion, collectionresult
        let queriedCollections, qcol, qcname, qcfields, i, collection, cres;

        queriedCollections = query.collections;

        for(i = 0; i < queriedCollections.length; i++){
            qcol = queriedCollections[i];
            qcname = qcol.name;
            qcfields = qcol.fields;

            collection = this.get(qcname);
            cres = collection.search(queryTerms, qcfields);
            numTotal += cres.length;
            total[qcname] = cres;
        }

        let spellingCandidateTerms = [];
        let term;

        if(numTotal < 5){
            for(i = 0; i < queryTerms.length; i++){
                term = queryTerms[i];
                if(term.length > this.config.minLenForSpellCorrect){
                    spellingCandidateTerms.concat(this.sc.singleCorrection(term));
                }
            }

            for(i = 0; i < queriedCollections.length; i++){
                qcol = queriedCollections[i];
                qcname = qcol.name;
                qcfields = qcol.fields;
                collection = this.get(qcname);
                cres = collection.searchSpellingCandidates(spellingCandidateTerms);
                numTotal += cres.length;
                total[qcname].concat(cres);
            }

        }

        if(numTotal < 1){
            for(i = 0; i < queryTerms.length; i++){
                term = queryTerms[i];
                if(term.length > this.config.minLenForSpellCorrect){
                    spellingCandidateTerms.concat(this.sc.doubleCorrection(term));
                }
            }

            for(i = 0; i < queriedCollections.length; i++){
                qcol = queriedCollections[i];
                qcname = qcol.name;
                qcfields = qcol.fields;
                collection = this.get(qcname);
                cres = collection.searchSpellingCandidates(spellingCandidateTerms);
                numTotal += cres.length;
                total[qcname].concat(cres);
            }
        }

        return total;
    }

}


// create(options){
    //     let name = options.name;
    //     let config = options.config;
    //     let collection = new Collection(config);
    //     this.collections[name] = collection;
    //     this.collections[name].save();
    // }

    // delete(name){
    //     this.collections[name].unsave();
    //     this.collections[name].drop();
    //     delete this.collections[name];
    // }

     // listCollections(){
    //     for(let cname in this.collections){
    //         console.log(cname);
    //     }
    // }