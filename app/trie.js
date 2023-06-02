
module.exports = class Trie{

    /* Od rjecnika pravi trie( prefiksno drvo ) */
    /* https://db.in.tum.de/~leis/papers/ART.pdf */
    /* Koristi se za autocomplete */
    /* TODO kompresiovani cvor */

    constructor(rindex){
        this.root = new Node();
        this.dictionary = rindex;
    }

    insert(word){
        this.root.insert(word);
    }

    delete(word){
        this.root.delete(word);
    }

    breadthSearch(node, word, maxRelativeDepth){
        
        let possibilitiesListNotExhausted = true;
        let maxRelativeDepthNotReached = true;

        let result = [];
        
        let currentLevelQueue = [];
        let nextLevelQueue = [];

        for(let child in node.children){
            nextLevelQueue.push([child, node.children[child]]);
        }

        let depth = 0;

        while(possibilitiesListNotExhausted && maxRelativeDepthNotReached){

            depth += 1;
            
            while(nextLevelQueue.length > 0){
                let pair = nextLevelQueue.shift(); // pair = [childname, childobj] odnosno [karakter, njegov objekat]
                currentLevelQueue.push(pair)
            }

            while(currentLevelQueue.length > 0){
                let pair = currentLevelQueue.shift();
                
                let substr = pair[0];
                let node = pair[1];
                if(this.dictionary.contains(word + substr)){ // ako postoji u rjecniku
                    result.push(word + substr);
                }

                for(let child in node.children){
                    nextLevelQueue.push([substr + child, node.children[child]]);
                }

            }

            if(nextLevelQueue.length == 0){
                possibilitiesListNotExhausted = false;
            }

            if(maxRelativeDepth && maxRelativeDepth <= depth){
                maxRelativeDepthNotReached = false;
            }

        }

        return result;

    }

    suggest(word, maxRelativeDepth){
        let pair =  this.root.search(word);
        let node = pair[0];
        let distance = word.length - pair[1];

        if(distance == word.length){
            return this.breadthSearch(node, word, maxRelativeDepth);
        }

        return [];
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