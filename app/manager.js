const Collection = require('./collection');
const Rindex = require('./rindex');
const Tokenizer = require('./tokenizer')
const Trie = require('./trie');


const Query = require('./query');
const Retriever = require('./retriever');


module.exports = class Manager{

    constructor(config){
        this.config = config;

        this.tokenizer = new Tokenizer();

        this.rindex = new Rindex();
        this.trie = new Trie(this.rindex);
        this.collections = {};
        this.build();
        
        this.query = new Query(this.config.nlp, this.config.synonyms, this.tokenizer, this.trie, this.rindex);
        this.retriever = new Retriever(this.rindex, this.config.data);
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

    getFlens(collections){
        let result = {};
        let i, name;
        for(i = 0; i < collections.length; i++){
            name = collections[i].name;
            result[name] = this.collections[name].flens;
        }

        return result;
    }

    fetch(documents){
        return documents;
    }

    removeInvalidFilters(collections){
        let collection, name, fields, field, i, j;
        for(i = 0; i < collections.length; i++){
            collection = collections[i];
            name = collection.name;
            fields = collection.fields;
            for(j = 0; j < fields.length; j++){
                field = fields[j];
                if(this.config.data.collections[name].fields[field].ignore){
                    collection.fields.splice(j, 1);
                    j--;
                }
            }
        }
        return collections;
    }

    search(query){
        let vector = this.query.handle(query.text);
        let filter = this.removeInvalidFilters(query.collections);
        let relevantFlens = this.getFlens(filter);
        let documents = this.retriever.retrieve(vector, filter, relevantFlens);
        documents = documents.length > 10 ? documents.slice(0, 10) : documents;
        let result = this.fetch(documents);
        return result;
    }

}