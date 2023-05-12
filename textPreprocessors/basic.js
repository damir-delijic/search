class Preprocessor{
    
    // konfiguracioni fajl za stopword, minimaltokenlen i charmap

    constructor(minimalTokenLen, stopwords, charMap){
        this.stopwords = stopwords;
        this.minimalTokenLen = minimalTokenLen;
        this.charMap = charMap;
    }

    process(segment){
        let result = [];
        let tokens = this.tokenize(segment);
        for(let i = 0; i < tokens.length; i++){
            tokens[i] = this.capitalize(tokens[i]);
            tokens[i] = this.depunct(tokens[i]);
            tokens[i] = this.replaceChars(tokens[i]);
            tokens[i] = this.stem(tokens[i]);
            if(tokens[i].length >= this.minimalTokenLen){
                result.push(tokens[i]);
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

var pp = new Preprocessor(2, [], {'ć':'c', 'ž':'z'});


let segment = 'Kuća porodice Džulijus: Misterija Aurore Tigarden';

let res = pp.process(segment);

console.log(segment);
console.log(res);