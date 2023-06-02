const Collection = require('./collection');
const ReverseIndex = require('./reverseIndex');
const Tokenizer = require('./tokenizer')
const Trie = require('./trie');


const QueryHandler = require('./queryHandler');
const DocumentHandler = require('./documentHandler');


module.exports = class Manager{

    constructor(config){
        this.config = config;

        this.tokenizer = new Tokenizer();

        this.reverseIndex = new ReverseIndex();
        this.trie = new Trie(this.reverseIndex);
        this.collections = {};
        this.build();
        
        this.queryHandler = new QueryHandler(this.config.nlp, this.config.synonyms, this.tokenizer, this.trie, this.reverseIndex);
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
                tokenizer: this.tokenizer,
                reverseIndex: this.reverseIndex,
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