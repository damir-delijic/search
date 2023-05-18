module.exports = class Preprocessor{
    
    constructor(){
        // dodati default neka podesavanja
        this.minTokenLen = 2;
    }

    // napraviti da process uzima jos argumenata kako bi svako polje moglo da se procesuira na svoj nacin

    process(segment, config){
        let result = [];
        let tokens = this.tokenize(segment, config.delimiters);
        let j, isStopword;
        for(let i = 0; i < tokens.length; i++){
            tokens[i] = this.capitalize(tokens[i]);
            tokens[i] = this.depunct(tokens[i]);
            tokens[i] = this.replaceChars(tokens[i], config.charMap);

            if(tokens[i].length >= this.minTokenLen){
                isStopword = false;
                for(j = 0; j < config.stopwords.length; j++){
                    if(tokens[i] == config.stopwords[j]){
                        isStopword = true;
                        break;
                    }
                }
                if(!isStopword) result.push(tokens[i]);
            }
        }
        return result;
    }

    tokenize(segment, delimiters){
        let delimiter;
        for(let di = 0; di < delimiters.length; di++){
            delimiter = delimiters[di];
            segment = segment.replaceAll(delimiter, ' ')
        }  
        return segment.split(' ');
    }

    capitalize(token){
        return token.toLowerCase();
    }

    depunct(token){
        return token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'');
    }

    replaceChars(token, charMap){
        // ako postoji charmap i ako ima clanova
        if(charMap && Object.keys(charMap).length > 0){
            let result = '';
            let char;
            for(let i = 0; i < token.length; i++){
                char = token[i];
                if(charMap[char]){ // ako karakter postoji u mapi, zamijeni mapiranim
                    result += charMap[char];
                }else{ // ako ne postoji samo nalijepi originalni
                    result += char;
                }
            }
            return result;
        }else{
            return token;
        }
      
    }

}