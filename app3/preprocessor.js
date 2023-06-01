module.exports = {
   
    tokenize: function(segment, separators){
        let separator, i, temp;

        temp = segment;
        
        for(i = 0; i < separators.length; i++){
            separator = separators[i];
            temp = temp.replaceAll(separator, ' ');
        }

        return temp.split(' ');
    },

    decapitalize: function(token){
        return token.toLowerCase();
    },

    depunctuate: function(token){
        return token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,'');
    },

    customDepunctuate: function(token, punctuation){
        let i, artifact, temp;

        temp = token;

        for(i = 0; i < punctuation.length; i++){
            artifact = punctuation[i];
            temp = temp.replaceAll(artifact, '');
        }

        return temp;
    },

    reMapCharacters: function(token, map){
        let result = '';
        let char;
        for(let i = 0; i < token.length; i++){
            char = token[i];
            if(map[char]){ // ako karakter postoji u mapi, zamijeni mapiranim
                result += map[char];
            }else{ // ako ne postoji samo nalijepi originalni
                result += char;
            }
        }
        return result;
    }

}