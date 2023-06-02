const Collection = require('./collection');
const Rindex = require('./rindex');
const Tokenizer = require('./tokenizer')
const Trie = require('./trie');


const QueryHandler = require('./queryHandler');
const DocumentHandler = require('./documentHandler');


module.exports = class Manager{

    constructor(config){
        this.config = config;

        this.tokenizer = new Tokenizer();

        this.rindex = new Rindex();
        this.trie = new Trie(this.rindex);
        this.collections = {};
        this.build();
        
        this.queryHandler = new QueryHandler(this.config.nlp, this.config.synonyms, this.tokenizer, this.trie, this.rindex);
        this.documentHandler = new DocumentHandler(this.rindex, this.config.data);
    }

    build(){
        let collections, collection;

        collections = this.config.data.collections;

        for(collection in collections){
            
            let options = {
                name: collection,
                config: collections[collection],
                nlp: this.config.nlp,
                tokenizer: this.tokenizer,
                rindex: this.rindex,
                trie: this.trie
            }

            this.collections[collection] = new Collection(options);
            this.collections[collection].build();
        }
    }

    fetch(documents){
        return documents;
    }

    search(query){

        let vector = this.queryHandler.handle(query.text);
        let documents = this.documentHandler.retrieve(vector, query.collections);
        documents = documents.length > 10 ? documents.slice(0, 10) : documents;
        let result = this.fetch(documents);
        return result;
    }

}