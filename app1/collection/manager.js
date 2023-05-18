const Collection = require('./collection');

module.exports = class Manager{

    constructor(config){
        this.collections = {};
        this.config = config;
    }

    build(){
        
        let name, config, collection;

        for(let col in this.config.data.collections){
            name = col;
            config = this.config.data.collections[name];
            collection = new Collection(config);
            collection.build();
            this.collections[name] = collection;
        }
    }

    create(options){
        let name = options.name;
        let config = options.config;
        let collection = new Collection(config);
        this.collections[name] = collection;
        this.collections[name].save();
    }

    delete(name){
        this.collections[name].unsave();
        this.collections[name].drop();
        delete this.collections[name];
    }

    getCollection(cname){
        return this.collections[cname];
    }

    listCollections(){
        for(let cname in this.collections){
            console.log(cname);
        }
    }

    search(query){
        let queryText = query.text;

        if(queryText.length < this.config.minQueryLen){
            return [];
        }

        let federatedResult = [];

        let collectionsToSearch = query.collections;
        let cQuery, colQueryResult, col, name, fields;
        let i;
        
        for(i = 0; i < collectionsToSearch.length; i++){
            cQuery = collectionsToSearch[i];
            name = cQuery.name;
            fields = cQuery.fields;
            col = this.getCollection(name);
            colQueryResult = col.search(queryText, fields);
            federatedResult.concat(colQueryResult);
        }

        return federatedResult;
    }

}