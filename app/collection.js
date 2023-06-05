module.exports = class Collection{

    constructor(options){
        this.config = options.config;
        this.nlp = options.nlp;
        this.name = options.name;
        this.tokenizer = options.tokenizer;
        this.rindex = options.rindex;
        this.trie = options.trie;
        this.data = [];
        this.flens = {}; //  duzina polja dokumenata kolekcije
    }

    fetch(list){
        if(this.config.type == "json"){
            return [];
        }
    }

    build(){
        // uzima podatke, stavlja u data
        if(this.config.type == "json"){
            let fs = require('fs');
            let data = JSON.parse(fs.readFileSync(this.config.path, 'utf8'));
            data = data.documents;
            let document, field;

            while(data.length > 0){
                let obj = {};
                document = data.shift();
                for(field in this.config.fields){
                    obj[field] = document[field];
                }
                this.data.push(obj);
            }

            this.handleData();

        }else if(this.config.type == 'database'){

            var sql = require("mssql/msnodesqlv8");


            let dbConfig = {
                connectionTimeout : 30000,
                connectionString: 'Driver={SQL Server Native Client 10.0};Server=' + this.config.serverName + ';Database=' + this.config.databaseName + ';Trusted_Connection=yes;',
            }

            let that = this;
            
            var dbConnect = new sql.connect(dbConfig,
                function(err)
                 {
                   if(err){
                     console.log("Error while connecting database: " + err)
                   }else{
                     console.log("connected to database: " + that.config.serverName)
                     var request = new sql.Request();
                   
                     // query to the database and get the records
                     request.query('select * from ' + that.config.tableName  , function (err, recordset) { // + ' where id = 9 or id = 1'
                         
                        if (err) console.log(err)
            
                        let newData = recordset.recordset;
                        let doc;
                        while(newData.length > 0){
                            doc = newData.shift();
                            that.data.push({
                                id: doc.ID,
                                title: doc.title,
                                actor: doc.actor 
                            });
                        }
                        that.handleData();
                     });
                   }
                 }
              )
        }

    }

    insert(document){
        this.handleDocument(document);
    }

    handleData(){
        let document;
        while(this.data.length > 0){
            document = this.data.shift();
            this.handleDocument(document);
        }
    }

    handleDocument(document){
        for(let field in document){
            if(!this.config.fields[field].ignore) this.handleField(document, field); // ako polja ne treba ignorisati po konfiguracija onda idi u parsiranje
        }
    }

    setFlens(id, field, len){
        if(!this.flens[id]){
            this.flens[id] = {};
        }

        if(!this.flens[id][field]){
            this.flens[id][field] = len;
        }

    }

    handleField(document, field){
        let content = document[field];
        if(content){
            let word, words, position;
        
            words = this.processText(content, field);
            this.setFlens(document.id, field, words.length);
    
            for(position = 0; position < words.length; position++){
                word = words[position];
                this.rindex.insert(word, this.name, document.id, field, position)
                this.trie.insert(word);
            }
        }
    }

    processText(text, field){
        
        let separators = this.config.fields[field].separators || this.nlp.separators || [];
        let charMap = this.nlp.charMap;
        let stopwords = this.nlp.stopwords || [];
        let minTokenLength = this.nlp.minTokenLength;

        let result = [];
        
        let tokens = this.tokenizer.tokenize(text, separators);
        
        let i, j, isNotStopword, stopword, token;

        for(i = 0; i < tokens.length; i++){
            tokens[i] = this.tokenizer.decapitalize(tokens[i]);
            tokens[i] = this.tokenizer.depunctuate(tokens[i])

            if(charMap){
                tokens[i] = this.tokenizer.reMapCharacters(tokens[i], charMap);
            }

            token = tokens[i];
            if(token.length > minTokenLength){
                
                isNotStopword = true;
                for(j = 0; j < stopwords.length; j++){
                    stopword = stopwords[j];
                    if(token == stopword){
                        isNotStopword = false;
                        break;
                    }
                }
                if(isNotStopword) result.push(token);

            }


        }

        return result;

    }

}