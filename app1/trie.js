
module.exports = class AdaptiveRadixTree{

    constructor(dictionary){
        this.root = new Node();
        this.dictionary = dictionary;
    }

    insert(word){
        this.root.insert(word);
    }

    delete(word){
        this.root.delete(word);
    }

    print(){
        this.root.print('-');
    }

    isWord(word){
        if(this.dictionary[word]) return true;
        else return false;
    }

    search(word){
        let pair =  this.root.search(word);
        let node = pair[0];
        let distance = word.length - pair[1];

        let results = {
            isExactWord: false,
            prediction: '',
            suggestions: []
        }


        let subWord = word.substring(0, distance);

        if(distance == word.length){
            if(this.isWord(word)){
                results.isExactWord = true;
                results.prediction = word;
            }
            results.suggestions = node.suggest(word, this);
        }else{
            if(this.isWord(subWord) && distance / word.length >= 0.75){
                results.prediction = subWord;
                results.suggestions = node.suggest(subWord, this)
            }
        }

        return results;
    }

}

class Node{

    constructor(){
        this.children = {};
    }

    // situacije: dodavanje nepostojeceg, dodavanje podstringa, dodavanje nadstringa

    insert(substr){
        if(substr.length == 0){
            return;
        }else{
            let key = substr[0];

            // ako ne postoji kljuc u potomcima, kreiraj ga
            if(!(key in this.children)){
                this.children[key] = new Node()
            }

            this.children[key].insert(substr.substring(1));
        }
    }

    // situacije: brisanje podstringa, brisanje nadstringa (brisanje cvorova do podstringa), brisanje nepostojeceg stringa

    delete(substr){
        if(substr.length == 0){
            if(Object.keys(this.children).length > 0){
                // ima djece, ostaje
                return true;
            }else{
                // nema djece, brise se
                return false;
            }
        }else{
            let key = substr[0];

            if(key in this.children){
                // da li child treba da se brise
                let toKeepChild = this.children[key].delete(substr.substring(1));

                if(!toKeepChild){
                    delete this.children[key];
                }

                return Object.keys(this.children).length > 0;
            }else{
                // string ne postoji
                return true;
            }
        }
    }

    // stampa

    print(indent){
        for(let child in this.children){
            this.children[child].print(indent + '-');
        }
    }

    // napraviti compressedNode? nema children samo value

    compress(){

    }

    // predlozi, bfs modifikovani

    suggest(word, art){
        
        let possibilitiesListNotExhausted = true;

        let result = [];
        
        let currentLevelQueue = [];
        let nextLevelQueue = [];

        for(let child in this.children){
            nextLevelQueue.push([child, this.children[child]]);
        }

        while(possibilitiesListNotExhausted){

            while(nextLevelQueue.length > 0){
                let pair = nextLevelQueue.shift();
                currentLevelQueue.push(pair)
            }

            while(currentLevelQueue.length > 0){
                let pair = currentLevelQueue.shift();
                
                let substr = pair[0];
                let node = pair[1];

                if(art.dictionary[word+substr]){ // ako postoji u rjecniku
                    result.push(word + substr);
                }

                for(let child in node.children){
                    nextLevelQueue.push([substr+child, node.children[child]]);
                }

            }

            if(nextLevelQueue.length == 0){
                possibilitiesListNotExhausted = false;
            }

        }

        return result;

    }

    // interna pretraga, vraca node i poziciju slova

    search(substr){
        if(substr.length == 0){
            return [this, substr.length];
        }else{
            let key = substr[0];

            if(key in this.children){
                return this.children[key].search(substr.substring(1));
            }else{
                // trenutni kljuc ne postoji u potomcima trenutnog node-a, mogu a i ne moraju postojati drugi
                return [this, substr.length]
            }

        }
    }

}