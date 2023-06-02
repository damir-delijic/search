module.exports = class Collection{

    constructor(options){
        this.config = options.config;
        this.nlp = options.nlp;
        this.name = options.name;
        this.tokenizer = options.tokenizer;
        this.reverseIndex = options.reverseIndex;
        this.trie = options.trie;
        this.data = [];
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
        }

        this.handleData();
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
            this.handleField(document, field)
        }
    }

    handleField(document, field){
        let content = document[field];
        let word, words, position;
    
        words = this.processText(content, field);
        
        for(position = 0; position < words.length; position++){
            word = words[position];
            this.reverseIndex.insert(word, this.name, document.id, field, position)
            this.trie.insert(word);
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