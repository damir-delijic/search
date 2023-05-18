const Preprocessor = require('../nlp/preprocessor')
const Posting = require('../structures/posting');
const ART = require('../structures/art')
const Spelling = require('../other/spelling');

module.exports = class Collection{

    constructor(config){
        this.config = config;
        let preprocessor = new Preprocessor(config.preprocessor);
        let postinglist = new Posting();
        let adaptiveradixtree = new ART(postinglist);
        let spelling = new Spelling(postinglist, config.alphabet);

        this.pp = preprocessor;
        this.pl = postinglist;
        this.art = adaptiveradixtree;
        this.sc = spelling;
    }

    isWord(word){
        if(this.pl.dict[word]) return true;
        else return false;
    }

    build(){
        let data = [];
        // load data from source
        
        // insert documents into data structures
        
        let document;

        for(let di = 0; di < data.length; di++){
            document = data[di];
            this.processDocument(document);
        }
        
    }

    processDocument(document){
        for(let field in this.config.schema){
            this.processField(document, field)
        }
    }

    processField(document, field){
        let schema = this.config.schema;
        let fContent = document[field];
        let term, terms;
        
        terms = this.pp.process(fContent, schema[field]);
        for(let ti = 0; i < terms.length; ti++){
            term = terms[ti];
            this.pl.insert(term, field, document.id, ti);
            this.art.insert(term);
        }

    }

    insert(document){
        this.processDocument(document);
    }

    drop(){
        delete this.sc;
        delete this.pp;
        delete this.art;
        delete this.pl;
    }

    remove(){

    }

    update(){

    }

    search(text, fields){
        let aa = this.art.search(text, 5);
        
        let result = [];
        let i, j, k;
        let term, docs, doc, field, temp, isPositionFound;

        for(i = 0; i < aa.length; i++){
            term = aa[i];
            docs = this.pl[term].docs;
            for(j = 0; j < docs.length; j++){
                doc = docs[j];
                temp = {
                    id: doc.id,
                    positions:{}
                }
                isPositionFound = false;
                for(k = 0; k < fields.length; k++){
                    field = fields[k];
                    if(doc.positions[field]){
                        isPositionFound = true;
                        temp.positions[field] = doc.positions[field];
                    }
                }

            }
        }

        let docResults = [];
        // let term, termDocs;
        // let j, doc, k, field;
        for(let i = 0; i < artResults; i++){
            term = artResults[i];
            termDocs = this.pl[term].docs;
            for(j = 0; j < termDocs.length; j++){
                doc = termDocs[j];
                for(k = 0; k < fields.length; k++){
                    field = fields[k];
                    if(doc.positions[field] && doc.positions[field].length > 0){
                        docResults.push(doc);
                    }
                }
            }
        }

        return docResults;
    }

}