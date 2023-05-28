const Posting = require('./xreverseIndex');
const Trie = require('./xtrie');

module.exports = class Collection{

    constructor(name, config, preprocessor){
        this.name = name;
        this.config = config;
        this.pp = preprocessor;
        this.pl = new Posting();
        this.art = new Trie(this.pl.dict);
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
        for(let field in document){
            this.processField(document, field)
        }
    }

    processField(document, field){
        let fContent = document[field];
        let term, terms;
        
        terms = this.pp.process(fContent);
        for(let ti = 0; i < terms.length; ti++){
            term = terms[ti];
            this.pl.insert(term, this.name, document.id, field, ti);
            this.art.insert(term);
        }

    }

    insert(document){
        this.processDocument(document);
    }

    remove(id){
        this.pl.delete(id);
    }

}