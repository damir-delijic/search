module.exports = class Preprocessor{
    
    constructor(minTokenLen, stopwords, charMap){
        this.stopwords = stopwords;
        this.minTokenLen = minTokenLen;
        this.charMap = charMap;
    }

    process(segment){
        let result = [];
        let tokens = this.tokenize(segment);
        let j, isStopword;
        for(let i = 0; i < tokens.length; i++){
            tokens[i] = this.capitalize(tokens[i]);
            tokens[i] = this.depunct(tokens[i]);
            tokens[i] = this.replaceChars(tokens[i]);
            tokens[i] = this.stem(tokens[i]);
            if(tokens[i].length >= this.minTokenLen){
                isStopword = false;
                for(j = 0; j < this.stopwords.length; j++){
                    if(tokens[i] == this.stopwords[j]){
                        isStopword = true;
                        break;
                    }
                }
                if(!isStopword) result.push(tokens[i]);
            }
        }
        return result;
    }

    tokenize(segment){
        return segment.split(' ');
    }

    capitalize(token){
        return token.toLowerCase();
    }

    depunct(token){
        return token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'');
    }

    replaceChars(token){
        let result = '';
        let char;
        for(let i = 0; i < token.length; i++){
            char = token[i];
            if(this.charMap[char]){
                result += this.charMap[char];
            }else{
                result += char;
            }
        }
        return result;
    }

    stem(token){
        // TODO stemmer
        return token;
    }

}