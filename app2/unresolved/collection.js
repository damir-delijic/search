module.exports = class Collection{

    /*
        Komunicira sa bazom, incijalno punjenje, i fetchovanje po id listi
    */

    constructor(args){
        this.config = args.config;
        this.defaultConfigNLP = args.defaultConfigNLP;

        this.name = args.name;
        this.preprocessor = args.preprocessor;
        this.reverseIndex = args.reverseIndex;
        this.trie = args.trie;
        this.data = [];
    }

    fetchAll(){
        // ovdje se vrsi uzimanje podataa iz baze, stavljanje u odredjeni format, sipanje u data, uzima samo 
        // polja koja su od interesa i trebaju biti indeksirana
    }

    fetch(list){
        
    }

    processData(){
        let document;
        while(this.data.length > 0){
            document = this.data[0];
            this.processDocument(document);
            this.data.shift();
        }
        
    }

    processDocument(document){
        for(let fieldName in document){
            this.processField(document, fieldName)
        }
    }

    nlp(fieldContent, fieldName){
        let text = fieldContent;

        let defaultConfigNLP = this.defaultConfigNLP;
        let fieldSpecificSeparators = this.config.fields[fieldName] ? this.config.fields[fieldName].separators : false;
        let config = {
            separators: fieldSpecificSeparators || defaultConfigNLP.separators || [],
            punctuation: defaultConfigNLP.punctuation || false,
            charmap: defaultConfigNLP.charMap,
            stopwords: defaultConfigNLP.stopwords || [],
            minTokenLen: defaultConfigNLP.minTokenLen || 2
        }

        let separators = config.separators;
        let punctuation = config.punctuation;
        let charmap = config.charmap;
        let minTokenLen = config.minTokenLen;
        let stopwords = config.stopwords;
        let result = [];
        
        let tokens;
        tokens = this.preprocessor.tokenizeMulti(text, separators);
        
        let i, j, isNotStopword, tokenIsLongEnough, stopword, token;

        for(i = 0; i < tokens.length; i++){
            tokens[i] = this.preprocessor.decapitalize(tokens[i]);
            if(punctuation){
                tokens[i] = this.preprocessor.depunctuate(tokens[i], punctuation)
            }else{
                tokens[i] = this.preprocessor.basicDepunctuation(tokens[i]);
            }

            if(charmap){
                tokens[i] = this.preprocessor.reMapCharacters(tokens[i], charmap);
            }

            tokenIsLongEnough = tokens[i].length >= minTokenLen;
            
            if(tokenIsLongEnough){
                token = tokens[i];
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

    processField(document, fieldName){
        let fieldContent = document[fieldName];
        let word, words, position;
    
        words = this.nlp(fieldContent, fieldName);
        
        for(position = 0; position < words.length; position++){
            word = words[position];
            this.reverseIndex.insert(word, this.name, document.id, position)
            this.trie.insert(word);
        }

    }

    insert(document){
        this.processDocument(document);
    }

}